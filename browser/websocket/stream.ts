import { ListenEventMap, socketIO, wrap } from "../../deps/socket.ts";
import { getProjectId } from "./id.ts";
export type {
  ProjectUpdatesStreamCommit,
  ProjectUpdatesStreamEvent,
} from "../../deps/socket.ts";

/** Streamを購読する
 *
 * @param project 購読したいproject
 * @param events 購読したいeventの種類。複数種類を指定できる
 */
export async function* listenStream<EventName extends keyof ListenEventMap>(
  project: string,
  ...events: EventName[]
) {
  const projectId = await getProjectId(project);

  const io = await socketIO();
  const { request, response } = wrap(io);
  await request("socket.io-request", {
    method: "room:join",
    data: { projectId, pageId: null, projectUpdatesStream: true },
  });
  try {
    yield* response(
      ...(events.length > 0 ? events : [
        "projectUpdatesStream:event",
        "projectUpdatesStream:commit",
      ] as const),
    );
  } finally {
    io.disconnect();
  }
}
