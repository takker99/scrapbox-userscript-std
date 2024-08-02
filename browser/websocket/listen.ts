import { createOk, isErr, type Result, unwrapOk } from "../../deps/option-t.ts";
import type {
  NotFoundError,
  NotLoggedInError,
  NotMemberError,
} from "../../deps/scrapbox-rest.ts";
import {
  type ProjectUpdatesStreamCommit,
  type ProjectUpdatesStreamEvent,
  type Socket,
  socketIO,
  wrap,
} from "../../deps/socket.ts";
import type { HTTPError } from "../../rest/responseIntoResult.ts";
import type { AbortError, NetworkError } from "../../rest/robustFetch.ts";
import { getProjectId } from "./pull.ts";
import { connect, disconnect } from "./socket.ts";
export type {
  ProjectUpdatesStreamCommit,
  ProjectUpdatesStreamEvent,
} from "../../deps/socket.ts";

export interface ListenStreamOptions {
  socket?: Socket;
}

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
    | NotFoundError
    | NotLoggedInError
    | NotMemberError
    | NetworkError
    | AbortError
    | HTTPError
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
  const socket = injectedSocket ?? await socketIO();
  await connect(socket);
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
