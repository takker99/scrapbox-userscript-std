import { push, type PushError, type PushOptions } from "./push.ts";
import type { Result } from "option-t/plain_result";

export type DeletePageOptions = PushOptions;

/** Delete a specified page from a Scrapbox project
 *
 * This function attempts to delete a page, but only if it's not marked as persistent.
 * Persistent pages (e.g., important documentation or system pages) cannot be deleted
 * to prevent accidental data loss.
 *
 * @param project - The project containing the page to delete
 * @param title - The title of the page to delete
 * @param options - Additional options for the delete operation (inherited from PushOptions)
 * @returns A Promise that resolves to a Result containing either:
 *          - Success: The page title that was deleted
 *          - Error: A PushError describing what went wrong
 */
export const deletePage = (
  project: string,
  title: string,
  options?: DeletePageOptions,
): Promise<Result<string, PushError>> =>
  push(
    project,
    title,
    (page) => page.persistent ? [{ deleted: true }] : [],
    options,
  );
