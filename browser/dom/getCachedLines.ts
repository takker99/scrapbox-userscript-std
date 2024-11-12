import type { Line, Scrapbox } from "@cosense/types/userscript";
declare const scrapbox: Scrapbox;

let isLatestData = /* @__PURE__ */ false;
let lines: Line[] | null = /* @__PURE__ */ null;

let initialize: (() => void) | undefined = () => {
  scrapbox.addListener("lines:changed", () => isLatestData = false);
  scrapbox.addListener("layout:changed", () => isLatestData = false);
  initialize = undefined;
};

/** scrapbox.Page.linesをcacheして取得する
 *
 * scrapbox.Page.linesの生成には時間がかかるので、実際に必要になるまで呼び出さないようにする
 *
 * @return `scrapbox.Page.lines`と同じ。常に最新のものが返される
 */
export const getCachedLines = (): readonly Line[] | null => {
  initialize?.();
  if (!isLatestData) {
    lines = scrapbox.Page.lines;
    isLatestData = true;
  }
  return lines;
};
