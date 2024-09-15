import type {
  NotFoundError,
  NotLoggedInError,
  NotMemberError,
} from "@cosense/types/rest";
import type { HTTPError } from "../../rest/responseIntoResult.ts";
import type { AbortError, NetworkError } from "../../rest/robustFetch.ts";
import type { ScrapboxSocket } from "./socket.ts";
import type { ListenEvents } from "./listen-events.ts";

export type {
  ProjectUpdatesStreamCommit,
  ProjectUpdatesStreamEvent,
} from "./listen-events.ts";

export interface ListenStreamOptions {
  signal?: AbortSignal;
  once?: boolean;
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
export const listen = <EventName extends keyof ListenEvents>(
  socket: ScrapboxSocket,
  event: EventName,
  listener: ListenEvents[EventName],
  options?: ListenStreamOptions,
): void => {
  if (options?.signal?.aborted) return;

  // deno-lint-ignore no-explicit-any
  (options?.once ? socket.once : socket.on)(event, listener as any);

  options?.signal?.addEventListener?.(
    "abort",
    // deno-lint-ignore no-explicit-any
    () => socket.off(event, listener as any),
    { once: true },
  );
};
