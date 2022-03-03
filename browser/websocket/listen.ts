import {
  ProjectUpdatesStreamCommit,
  ProjectUpdatesStreamEvent,
  Socket,
  socketIO,
  wrap,
} from "../../deps/socket.ts";
import { connect, disconnect } from "./socket.ts";
import { getProjectId } from "./id.ts";
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
  ProjectUpdatesStreamEvent | ProjectUpdatesStreamCommit,
  void,
  unknown
> {
  const projectId = await getProjectId(project);

  const injectedSocket = options?.socket;
  const socket = injectedSocket ?? await socketIO();
  await connect(socket);
  const { request, response } = wrap(socket);

  // 部屋に入って購読し始める
  await request("socket.io-request", {
    method: "room:join",
    data: { projectId, pageId: null, projectUpdatesStream: true },
  });
  try {
    yield* response(
      ...events.map((event) => `projectUpdatesStream:${event}` as const),
    );
  } finally {
    if (!injectedSocket) await disconnect(socket);
  }
}
