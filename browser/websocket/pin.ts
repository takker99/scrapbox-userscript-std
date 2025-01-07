import type { Result } from "option-t/plain_result";
import type { Change } from "./change.ts";
import { push, type PushError, type PushOptions } from "./push.ts";

export interface PinOptions extends PushOptions {
  /** Option to control behavior when the target page doesn't exist
   *
   * - `true`: Create a new page with just the title and pin it
   * - `false`: Do not pin (skip the operation)
   *
   * This is useful when you want to create and pin placeholder pages
   * that will be filled with content later.
   *
   * @default false
   */
  create?: boolean;
}

/** Pin a Scrapbox page to keep it at the top of the project
 *
 * Pinned pages are sorted by their pin number, which is calculated
 * based on the current timestamp to maintain a stable order.
 * Higher pin numbers appear first in the list.
 *
 * @param project - Project containing the target page
 * @param title - Title of the page to pin
 * @param options - Optional settings:
 *                 - socket: Custom WebSocket connection
 *                 - create: Whether to create non-existent pages
 */
export const pin = (
  project: string,
  title: string,
  options?: PinOptions,
): Promise<Result<string, PushError>> =>
  push(
    project,
    title,
    (page) => {
      // Skip if already pinned or if page doesn't exist and create=false
      if (
        page.pin > 0 || (!page.persistent && !(options?.create ?? false))
      ) return [];
      // Create page and pin it in a single operation
      // Note: The server accepts combined creation and pin operations
      const pinChange: Change = { pin: pinNumber() };
      const changes: Change[] = [pinChange];
      if (!page.persistent) changes.unshift({ title });
      return changes;
    },
    options,
  );

export interface UnPinOptions extends PushOptions {}

/** Unpin a Scrapbox page, removing it from the pinned list
 *
 * This sets the page's pin number to 0, which effectively unpins it.
 * The page will return to its normal position in the project's page list.
 *
 * @param project - Project containing the target page
 * @param title - Title of the page to unpin
 */
export const unpin = (
  project: string,
  title: string,
  options: UnPinOptions,
): Promise<Result<string, PushError>> =>
  push(
    project,
    title,
    (page) =>
      // Skip if already unpinned or if page doesn't exist
      page.pin == 0 || !page.persistent ? [] : [{ pin: 0 }],
    options,
  );

/** Calculate a pin number for sorting pinned pages
 *
 * The pin number is calculated as:
 * MAX_SAFE_INTEGER - (current Unix timestamp in seconds)
 *
 * This ensures that:
 * 1. More recently pinned pages appear lower in the pinned list
 * 2. Pin numbers are unique and stable
 * 3. There's enough room for future pins (MAX_SAFE_INTEGER is very large)
 */
export const pinNumber = (): number =>
  Number.MAX_SAFE_INTEGER - Math.floor(Date.now() / 1000);
