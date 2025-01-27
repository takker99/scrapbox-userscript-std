import type { Change, DeletePageChange } from "./change.ts";
import { makeChanges } from "./makeChanges.ts";
import type { BaseLine, Page } from "@cosense/types/rest";
import { push, type PushError, type PushOptions } from "./push.ts";
import { suggestUnDupTitle } from "./suggestUnDupTitle.ts";
import type { Result } from "option-t/plain_result";
import type { Socket } from "socket.io-client";

export interface PatchMetadata extends Page {
  /** Number of retry attempts for page modification
   *
   * Starts at `0` for the first attempt and increments with each retry.
   * This helps track and handle concurrent modification conflicts.
   */
  attempts: number;
}

/**
 * Function used in {@linkcode patch} to generate a patch from the current page state
 *
 * This function is used to generate a patch from the current page state.
 * It receives the current page lines and metadata and returns the new page content.
 * The function can be synchronous or asynchronous.
 *
 * @param lines - Current page lines
 * @param metadata - Current page metadata
 * @returns one of the following or a {@linkcode Promise} resolving to one:
 * - `(string | { text: string; })[]`: New page content
 * - `[]`: Delete the page
 * - `undefined`: Abort modification
 */
export type MakePatchFn = (
  lines: BaseLine[],
  metadata: PatchMetadata,
) =>
  | (string | { text: string })[]
  | undefined
  | Promise<(string | { text: string })[] | undefined>;

export type PatchOptions = PushOptions;

/** Modify an entire Scrapbox page by computing and sending only the differences
 *
 * This function handles the entire page modification process:
 * 1. Fetches current page content
 * 2. Applies user-provided update function
 * 3. Computes minimal changes needed
 * 4. Handles errors (e.g., duplicate titles)
 * 5. Retries on conflicts
 *
 * @param project Project ID containing the target page
 * @param title Title of the page to modify
 * @param update Function to generate new content
 * @param options Optional WebSocket configuration
 *
 * Special cases:
 * - If `update` returns `undefined`: Operation is cancelled
 * - If `update` returns `[]`: Page is deleted
 * - On duplicate title: Automatically suggests non-conflicting title
 */
export const patch = (
  project: string,
  title: string,
  update: MakePatchFn,
  options?: PatchOptions,
): Promise<Result<string, PushError | Socket.DisconnectReason>> =>
  push(
    project,
    title,
    async (page, attempts, prev, reason) => {
      if (reason === "DuplicateTitleError") {
        const fallbackTitle = suggestUnDupTitle(title);
        return prev.map((change) => {
          if ("title" in change) change.title = fallbackTitle;
          return change;
        }) as Change[] | [DeletePageChange];
      }
      const pending = update(page.lines, { ...page, attempts });
      const newLines = pending instanceof Promise ? await pending : pending;
      if (newLines === undefined) return [];
      if (newLines.length === 0) return [{ deleted: true }];
      return [...makeChanges(page, newLines, page.userId)];
    },
    options,
  );
