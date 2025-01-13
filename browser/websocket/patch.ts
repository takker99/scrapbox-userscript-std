import type { Change, DeletePageChange, PinChange } from "./change.ts";
import { makeChanges } from "./makeChanges.ts";
import type { BaseLine, Page } from "@cosense/types/rest";
import { push, type PushError, type PushOptions } from "./push.ts";
import { suggestUnDupTitle } from "./suggestUnDupTitle.ts";
import type { Result } from "option-t/plain_result";
import type { Socket } from "socket.io-client";

export type PatchOptions = PushOptions;

export interface PatchMetadata extends Page {
  /** Number of retry attempts for page modification
   *
   * Starts at `0` for the first attempt and increments with each retry.
   * This helps track and handle concurrent modification conflicts.
   */
  attempts: number;
}

/** Modify an entire Scrapbox page by computing and sending only the differences
 *
 * This function handles the entire page modification process:
 * 1. Fetches current page content
 * 2. Applies user-provided update function
 * 3. Computes minimal changes needed
 * 4. Handles errors (e.g., duplicate titles)
 * 5. Retries on conflicts
 *
 * @param project - Project ID containing the target page
 * @param title - Title of the page to modify
 * @param update - Function to generate new content:
 *                - Input: Current page lines and metadata
 *                - Return values:
 *                  - `string[]`: New page content
 *                  - `undefined`: Abort modification
 *                  - `[]`: Delete the page
 *                Can be async (returns `Promise`)
 * @param options - Optional WebSocket configuration
 *
 * Special cases:
 * - If update returns undefined: Operation is cancelled
 * - If update returns []: Page is deleted
 * - On duplicate title: Automatically suggests non-conflicting title
 */
export const patch = (
  project: string,
  title: string,
  update: (
    lines: BaseLine[],
    metadata: PatchMetadata,
  ) => string[] | undefined | Promise<string[] | undefined>,
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
        }) as Change[] | [DeletePageChange] | [PinChange];
      }
      const pending = update(page.lines, { ...page, attempts });
      const newLines = pending instanceof Promise ? await pending : pending;
      if (newLines === undefined) return [];
      if (newLines.length === 0) return [{ deleted: true }];
      return [...makeChanges(page, newLines, page.userId)];
    },
    options,
  );
