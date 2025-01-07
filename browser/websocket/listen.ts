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

/** Subscribe to WebSocket events from Scrapbox
 *
 * This function sets up event listeners for Scrapbox's WebSocket events:
 * - Uses socket.on() for continuous listening
 * - Uses socket.once() for one-time events when options.once is true
 * - Supports automatic cleanup with AbortSignal
 *
 * @param socket - ScrapboxSocket instance for WebSocket communication
 * @param event - Event name to listen for (from ListenEvents type)
 * @param listener - Callback function to handle the event
 * @param options - Optional configuration:
 *                 - signal: AbortSignal for cancellation
 *                 - once: Listen only once if true
 *
 * Example:
 * ```ts
 * listen(socket, "project:update", (data: ProjectUpdateData) => {
 *   console.log("Project updated:", data);
 * }, { signal: controller.signal });
 * ```
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
