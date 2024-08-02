import {
  Change,
  DeletePageChange,
  PageCommit,
  PageCommitError,
  PageCommitResponse,
  PinChange,
  Result as SocketResult,
  Socket,
  socketIO,
  TimeoutError,
  wrap,
} from "../../deps/socket.ts";
import { connect, disconnect } from "./socket.ts";
import { pull } from "./pull.ts";
import {
  ErrorLike,
  NotFoundError,
  NotLoggedInError,
  NotMemberError,
  Page,
} from "../../deps/scrapbox-rest.ts";
import { sleep } from "../../sleep.ts";
import {
  createErr,
  createOk,
  isErr,
  Result,
  unwrapOk,
} from "../../deps/option-t.ts";
import { TooLongURIError } from "../../mod.ts";
import { HTTPError } from "../../rest/responseIntoResult.ts";
import { AbortError, NetworkError } from "../../rest/robustFetch.ts";

export interface PushOptions {
  /** 外部からSocketを指定したいときに使う */
  socket?: Socket;

  /** pushの再試行回数
   *
   * これを上回ったら、`RetryError`を返す
   */
  maxAttempts?: number;
}

export interface RetryError {
  name: "RetryError";
  message: string;
  attempts: number;
}

export interface PushMetadata extends Page {
  projectId: string;
  userId: string;
}

export interface UnexpectedError extends ErrorLike {
  name: "UnexpectedError";
}

export type PushError =
  | RetryError
  | UnexpectedError
  | NotFoundError
  | NotLoggedInError
  | Omit<NotLoggedInError, "details">
  | NotMemberError
  | TooLongURIError
  | HTTPError
  | NetworkError
  | AbortError;

/** 特定のページのcommitをpushする
 *
 * serverからpush errorが返ってきた場合、エラーに応じてpushを再試行する
 *
 * @param project project name
 * @param title page title
 * @param makeCommit pushしたいcommitを作る関数。空配列を返すとpushを中断する
 * @param options
 * @retrun 成功 or キャンセルのときは`commitId`を返す。再試行回数が上限に達したときは`RetryError`を返す
 */
export const push = async (
  project: string,
  title: string,
  makeCommit: (
    page: PushMetadata,
    attempts: number,
    prev: Change[] | [DeletePageChange] | [PinChange],
    reason?: "NotFastForwardError" | "DuplicateTitleError",
  ) =>
    | Promise<Change[] | [DeletePageChange] | [PinChange]>
    | Change[]
    | [DeletePageChange]
    | [PinChange],
  options?: PushOptions,
): Promise<Result<string, PushError>> => {
  const injectedSocket = options?.socket;
  const socket = injectedSocket ?? await socketIO();
  await connect(socket);
  const pullResult = await pull(project, title);
  if (isErr(pullResult)) return pullResult;
  let metadata = unwrapOk(pullResult);

  try {
    const { request } = wrap(socket);
    let attempts = 0;
    let changes: Change[] | [DeletePageChange] | [PinChange] = [];
    let reason: "NotFastForwardError" | "DuplicateTitleError" | undefined;

    // loop for create Diff
    while (
      options?.maxAttempts === undefined || attempts < options.maxAttempts
    ) {
      const pending = makeCommit(metadata, attempts, changes, reason);
      changes = pending instanceof Promise ? await pending : pending;
      attempts++;
      if (changes.length === 0) return createOk(metadata.commitId);

      const data: PageCommit = {
        kind: "page",
        projectId: metadata.projectId,
        pageId: metadata.id,
        parentId: metadata.commitId,
        userId: metadata.userId,
        changes,
        cursor: null,
        freeze: true,
      };

      // loop for push changes
      while (true) {
        const result = (await request("socket.io-request", {
          method: "commit",
          data,
        })) as SocketResult<
          PageCommitResponse,
          UnexpectedError | TimeoutError | PageCommitError
        >;

        if (result.ok) {
          metadata.commitId = result.value.commitId;
          // success
          return createOk(metadata.commitId);
        }
        const name = result.value.name;
        if (name === "UnexpectedError") {
          return createErr({ name, message: JSON.stringify(result.value) });
        }
        if (name === "TimeoutError" || name === "SocketIOError") {
          await sleep(3000);
          // go back to the push loop
          continue;
        }
        if (name === "NotFastForwardError") {
          await sleep(1000);
          const pullResult = await pull(project, title);
          if (isErr(pullResult)) return pullResult;
          metadata = unwrapOk(pullResult);
        }
        reason = name;
        // go back to the diff loop
        break;
      }
    }
    return createErr({
      name: "RetryError",
      attempts,
      // from https://github.com/denoland/deno_std/blob/0.223.0/async/retry.ts#L23
      message: `Retrying exceeded the maxAttempts (${attempts}).`,
    });
  } finally {
    if (!injectedSocket) await disconnect(socket);
  }
};
