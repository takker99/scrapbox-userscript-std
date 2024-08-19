import { createOk, isErr, type Result, unwrapOk } from "option-t/plain_result";
import type {
  NotFoundError,
  NotLoggedInError,
  NotMemberError,
} from "@cosense/types/rest";
import type {
  ProjectUpdatesStreamCommit,
  ProjectUpdatesStreamEvent,
} from "./emit.ts";
import type { HTTPError } from "../../rest/responseIntoResult.ts";
import type { AbortError, NetworkError } from "../../rest/robustFetch.ts";
import { getProjectId } from "./pull.ts";
import { connect, disconnect } from "./socket.ts";
import type { Socket } from "socket.io-client";

export type {
  ProjectUpdatesStreamCommit,
  ProjectUpdatesStreamEvent,
} from "./websocket-types.ts";

export interface ListenStreamOptions {
  socket?: Socket;
}

export type ListenStreamError =
  | NotFoundError
  | NotLoggedInError
  | NotMemberError
  | NetworkError
  | AbortError
  | HTTPError;

/** Streamを購読する
 *
 * @param project 購読したいproject
 * @param events 購読したいevent。配列で指定する
 * @param options 使用したいSocketがあれば指定する
 */
export async function* listenStream(
  project: string,
  events: ["commit" | "event", ...("commit" | "event")[]],
  options?: ListenStreamOptions,
): AsyncGenerator<
  Result<
    ProjectUpdatesStreamEvent | ProjectUpdatesStreamCommit,
    ListenStreamError
  >,
  void,
  unknown
> {
  const result = await getProjectId(project);
  if (isErr(result)) {
    yield result;
    return;
  }
  const projectId = unwrapOk(result);

  const injectedSocket = options?.socket;
  const result2 = await connect(injectedSocket);
  if (isErr(result2)) throw new Error("Failed to connect to websocket");
  const socket = unwrapOk(result2);
  const { request, response } = wrap(socket);

  try {
    // 部屋に入って購読し始める
    await request("socket.io-request", {
      method: "room:join",
      data: { projectId, pageId: null, projectUpdatesStream: true },
    });

    for await (
      const streamEvent of response(
        ...events.map((event) => `projectUpdatesStream:${event}` as const),
      )
    ) {
      yield createOk(streamEvent);
    }
  } finally {
    if (!injectedSocket) await disconnect(socket);
  }
}
