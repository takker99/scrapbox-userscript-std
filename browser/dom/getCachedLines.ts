import type { Line, Scrapbox } from "@cosense/types/userscript";
declare const scrapbox: Scrapbox;

let isLatestData = /* @__PURE__ */ false;
let lines: Line[] | null = /* @__PURE__ */ null;

let initialize: (() => void) | undefined = () => {
  scrapbox.addListener("lines:changed", () => isLatestData = false);
  scrapbox.addListener("layout:changed", () => isLatestData = false);
  initialize = undefined;
};

/** Get cached version of `{@linkcode https://jsr.io/@cosense/types/doc/userscript/~/Page.lines scrapbox.Page.lines}`
 *
 * This function caches the result of `{@linkcode https://jsr.io/@cosense/types/doc/userscript/~/Page.lines scrapbox.Page.lines}` to improve performance,
 * as generating the lines array is computationally expensive.
 * The cache is automatically invalidated when the page content changes.
 *
 * @returns Same as `{@linkcode https://jsr.io/@cosense/types/doc/userscript/~/Page.lines scrapbox.Page.lines}`. Always returns the latest data through cache management
 */
export const getCachedLines = (): readonly Line[] | null => {
  initialize?.();
  if (!isLatestData) {
    lines = scrapbox.Page.lines;
    isLatestData = true;
  }
  return lines;
};
