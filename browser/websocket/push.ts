import type {
  Change,
  DeletePageChange,
  PageCommit,
  PinChange,
} from "./websocket-types.ts";
import { connect, disconnect } from "./socket.ts";
import type { Socket } from "socket.io-client";
import { emit } from "./emit.ts";
import { pull } from "./pull.ts";
import type {
  ErrorLike,
  NotFoundError,
  NotLoggedInError,
  NotMemberError,
  Page,
} from "@cosense/types/rest";
import { delay } from "@std/async/delay";
import {
  createErr,
  createOk,
  isErr,
  type Result,
  unwrapErr,
  unwrapOk,
} from "option-t/plain_result";
import type { HTTPError } from "../../rest/responseIntoResult.ts";
import type { AbortError, NetworkError } from "../../rest/robustFetch.ts";
import type { TooLongURIError } from "../../rest/pages.ts";
import type {
  SocketIOServerDisconnectError,
  UnexpectedRequestError,
} from "./error.ts";

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
  | SocketIOServerDisconnectError
  | UnexpectedRequestError
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
  const result = await connect(options?.socket);
  if (isErr(result)) {
    return createErr({
      name: "UnexpectedRequestError",
      error: unwrapErr(result),
    });
  }
  const socket = unwrapOk(result);
  const pullResult = await pull(project, title);
  if (isErr(pullResult)) return pullResult;
  let metadata = unwrapOk(pullResult);

  try {
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
        const result = await emit(socket, "commit", data);
        if (createOk(result)) {
          metadata.commitId = unwrapOk(result).commitId;
          // success
          return createOk(metadata.commitId);
        }
        const error = unwrapErr(result);
        const name = error.name;
        if (
          name === "SocketIOServerDisconnectError" ||
          name === "UnexpectedRequestError"
        ) {
          return createErr(error);
        }
        if (name === "TimeoutError" || name === "SocketIOError") {
          await delay(3000);
          // go back to the push loop
          continue;
        }
        if (name === "NotFastForwardError") {
          await delay(1000);
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
    if (!options?.socket) await disconnect(socket);
  }
};
