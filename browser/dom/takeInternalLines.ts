import type { BaseLine } from "@cosense/types/userscript";
import { getCachedLines } from "./getCachedLines.ts";

/** Get the page line data
 *
 * @deprecated Use {@linkcode getCachedLines} or {@linkcode https://jsr.io/@cosense/types/doc/userscript/~/Page.lines scrapbox.Page.lines} instead.
 * @returns The page content as a readonly array of line objects
 */
export const takeInternalLines = (): readonly BaseLine[] =>
  getCachedLines() ?? [];
