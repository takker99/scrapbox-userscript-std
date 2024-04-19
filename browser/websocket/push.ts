import {
  Change,
  DeletePageChange,
  PageCommit,
  PageCommitError,
  PageCommitResponse,
  PinChange,
  Socket,
  socketIO,
  TimeoutError,
  UnexpectedError,
  wrap,
} from "../../deps/socket.ts";
import { connect, disconnect } from "./socket.ts";
import { getProjectId, getUserId } from "./id.ts";
import { pull } from "./pull.ts";
import { Page } from "../../deps/scrapbox-rest.ts";
import { sleep } from "../../sleep.ts";
import { Result } from "../../rest/util.ts";

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
): Promise<Result<string, RetryError>> => {
  const [
    page_,
    projectId,
    userId,
  ] = await Promise.all([
    pull(project, title),
    getProjectId(project),
    getUserId(),
  ]);

  let page: PushMetadata = { ...page_, projectId, userId };

  const injectedSocket = options?.socket;
  const socket = injectedSocket ?? await socketIO();
  await connect(socket);

  try {
    const { request } = wrap(socket);
    // loop for create Diff
    let attempts = 0;
    let changes: Change[] | [DeletePageChange] | [PinChange] = [];
    let reason: "NotFastForwardError" | "DuplicateTitleError" | undefined;
    while (
      options?.maxAttempts === undefined || attempts < options.maxAttempts
    ) {
      const pending = makeCommit(page, attempts, changes, reason);
      changes = pending instanceof Promise ? await pending : pending;
      attempts++;
      if (changes.length === 0) {
        return { ok: true, value: page.commitId };
      }

      const data: PageCommit = {
        kind: "page",
        projectId,
        pageId: page.id,
        parentId: page.commitId,
        userId,
        changes,
        cursor: null,
        freeze: true,
      };

      // loop for push changes
      while (true) {
        const result = (await request("socket.io-request", {
          method: "commit",
          data,
        })) as Result<
          PageCommitResponse,
          UnexpectedError | TimeoutError | PageCommitError
        >;

        if (result.ok) {
          page.commitId = result.value.commitId;
          // success
          return { ok: true, value: page.commitId };
        }
        const name = result.value.name;
        if (name === "UnexpectedError") {
          const error = new Error();
          error.name = result.value.name;
          error.message = JSON.stringify(result.value);
          throw error;
        }
        if (name === "TimeoutError" || name === "SocketIOError") {
          await sleep(3000);
          // go back to the diff loop
          break;
        }
        if (name === "NotFastForwardError") {
          page = { ...await pull(project, title), projectId, userId };
        }
        reason = name;
        // go back to the push loop
      }
    }
    return {
      ok: false,
      value: {
        name: "RetryError",
        attempts,
        // from https://github.com/denoland/deno_std/blob/0.223.0/async/retry.ts#L23
        message: `Retrying exceeded the maxAttempts (${attempts}).`,
      },
    };
  } finally {
    if (!injectedSocket) await disconnect(socket);
  }
};
