import type {
  NotFoundError,
  NotLoggedInError,
  NotMemberError,
} from "@cosense/types/rest";
import type { HTTPError } from "../rest/responseIntoResult.ts";
import type { AbortError, NetworkError } from "../rest/robustFetch.ts";
import type { ScrapboxSocket } from "./socket.ts";
import type { ListenEventMap } from "@cosense/types/websocket";

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

/** Subscribe to WebSocket events from Scrapbox
 *
 * This function sets up event listeners for Scrapbox's WebSocket events:
 * - Uses socket.on() for continuous listening
 * - Uses socket.once() for one-time events when options.once is true
 * - Supports automatic cleanup with AbortSignal
 *
 * @param socket - ScrapboxSocket instance for WebSocket communication
 * @param event - Event name to listen for (from {@linkcode ListenEventMap} type)
 * @param listener - Callback function to handle the event
 * @param options - Optional configuration
 *
 * @example
 * ```typescript
 * import { connect } from "@cosense/std/browser/websocket";
 * import { unwrapOk } from "option-t/plain_result";
 *
 * // Setup socket and controller
 * const socket = unwrapOk(await connect());
 *
 * // Listen for pages' changes in a specified project
 * listen(socket, "projectUpdatesStream:commit", (data) => {
 *   console.log("Project updated:", data);
 * });
 * ```
 */
export const listen = <EventName extends keyof ListenEventMap>(
  socket: ScrapboxSocket,
  event: EventName,
  listener: ListenEventMap[EventName],
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
