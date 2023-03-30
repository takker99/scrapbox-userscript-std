import { Line, Scrapbox } from "../../deps/scrapbox.ts";
declare const scrapbox: Scrapbox;

let isLatestData = false;
let lines: typeof scrapbox.Page.lines = null;

scrapbox.addListener("lines:changed", () => isLatestData = false);
scrapbox.addListener("layout:changed", () => isLatestData = false);

/** scrapbox.Page.linesをcacheして取得する
 *
 * scrapbox.Page.linesの生成には時間がかかるので、実際に必要になるまで呼び出さないようにする
 *
 * @return `scrapbox.Page.lines`と同じ。常に最新のものが返される
 */
export const getCachedLines = (): readonly Line[] | null => {
  if (!isLatestData) {
    lines = scrapbox.Page.lines;
    isLatestData = true;
  }
  return lines;
};
