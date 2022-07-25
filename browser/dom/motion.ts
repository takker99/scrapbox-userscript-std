/// <reference no-default-lib="true"/>
/// <reference lib="esnext"/>
/// <reference lib="dom" />

import { press } from "./press.ts";
import { click, holdDown } from "./click.ts";
import {
  getCharDOM,
  getHeadCharDOM,
  getHeadLineDOM,
  getLineCount,
  getLineDOM,
  getLineNo,
  getTailLineDOM,
  getText,
} from "./node.ts";
import { caret } from "./caret.ts";
import { isHeightViewable } from "./isHeightViewable.ts";
import { range } from "../../range.ts";

/** @deprecated
 * カーソル行の行末を長押ししてfocusを得る
 *
 * mobile版scrapbox用
 *
 * @param [holding=1000] 長押しする時間(ミリ秒単位)
 */
export const focusEnd = async (holding = 1000): Promise<void> => {
  const target = getLineDOM(caret().position.line)
    ?.getElementsByClassName(
      "text",
    )?.[0] as (HTMLDivElement | undefined);
  if (!target) throw Error(".line .target can't be found.");
  if (!isHeightViewable(target)) target.scrollIntoView({ block: "center" });

  const { right, top, height } = target.getBoundingClientRect();
  await holdDown(target, { X: right + 1, Y: top + height / 2, holding });
};

/** カーソルを左に動かす
 *
 * @param [count=1] 動かす回数
 */
export const moveLeft = (count = 1): void => {
  for (const _ of range(0, count)) {
    press("ArrowLeft");
  }
};
/** カーソルを上に動かす
 *
 * @param [count=1] 動かす回数
 */
export const moveUp = (count = 1): void => {
  for (const _ of range(0, count)) {
    press("ArrowUp");
  }
};
/** カーソルを下に動かす
 *
 * @param [count=1] 動かす回数
 */
export const moveDown = (count = 1): void => {
  for (const _ of range(0, count)) {
    press("ArrowDown");
  }
};
/** カーソルを右に動かす
 *
 * @param [count=1] 動かす回数
 */
export const moveRight = (count = 1): void => {
  for (const _ of range(0, count)) {
    press("ArrowRight");
  }
};

/** インデントを除いた行頭に移動する */
export const goHeadWithoutBlank = (): void => {
  press("End");
  press("Home");
};
/** 最後の非空白文字に移動する */
export const goEndWithoutBlank = (): void => {
  press("End");
  moveLeft(
    getText(caret().position.line)?.match?.(/(\s*)$/)?.[1]?.length ?? 0,
  );
};
/** 行頭に移動する */
export const goHead = (): void => {
  press("Home");
  press("Home");
};
/** 行末に移動する */
export const goEnd = (): void => {
  press("End");
};

/** 最初の行の行頭に移動する */
export const goHeadLine = async (): Promise<void> => {
  const target = getHeadLineDOM();
  if (!target) throw Error(".line:first-of-type can't be found.");
  if (!isHeightViewable(target)) target.scrollIntoView({ block: "center" });

  const charDOM = getHeadCharDOM(target);
  if (!charDOM) throw Error(".line:first-of-type .c-0 can't be found.");
  const { left, top } = charDOM.getBoundingClientRect();
  await click(target, { X: left, Y: top });
};
/** 最後の行の行末に移動する */
export const goLastLine = async (): Promise<void> => {
  await _goLine(getTailLineDOM());
};
/** 任意の行の行末に移動する
 *
 * @param value 移動したい行の行番号 or 行ID or 行のDOM
 */
export const goLine = async (
  value: string | number | HTMLElement | undefined,
): Promise<void> => {
  await _goLine(getLineDOM(value));
};
const _goLine = async (target: HTMLDivElement | undefined) => {
  if (!target) throw Error("The target line DOM is failed to find.");
  if (!isHeightViewable(target)) target.scrollIntoView({ block: "center" });

  const { right, top, height } = target.getElementsByClassName("text")[0]
    .getBoundingClientRect();
  await click(target, { X: right + 1, Y: top + height / 2 });
};

/** 任意の文字に移動する
 *
 * クリックで移動できない文字に移動しようとすると失敗するので注意
 *
 * @param line 移動したい文字がある行
 * @param pos 移動したい文字の列
 */
export const goChar = async (
  line: string | number | HTMLElement,
  pos: number,
): Promise<void> => {
  const charDOM = getCharDOM(line, pos);
  if (!charDOM) {
    throw Error(
      `Could not find the char DOM at line: ${getLineNo(line)}, column: ${pos}`,
    );
  }
  if (!isHeightViewable(charDOM)) charDOM.scrollIntoView({ block: "center" });

  const { left, top } = charDOM.getBoundingClientRect();
  await click(charDOM, { X: left, Y: top });
};

/** 画面に収まる最大行数を計算する
 *
 * 行の高さは最後の行を基準とする
 */
const getVisibleLineCount = (): number => {
  const clientHeight = getTailLineDOM()?.clientHeight;
  if (clientHeight === undefined) {
    throw Error("Could not find .line:last-of-type");
  }
  return Math.round(window.innerHeight / clientHeight);
};

/** 半ページ上にスクロールする
 *
 * @param [count=1] スクロール回数
 */
export const scrollHalfUp = async (count = 1): Promise<void> => {
  const lineNo = getLineNo(caret().position.line);
  if (lineNo === undefined) {
    throw Error("Could not detect the present cursor line No.");
  }
  const index = Math.round(
    (lineNo - getVisibleLineCount() / 2) * count,
  );
  await goLine(Math.max(index, 0));
};
/** 半ページ下にスクロールする
 *
 * @param [count=1] スクロール回数
 */
export const scrollHalfDown = async (count = 1): Promise<void> => {
  const lineNo = getLineNo(caret().position.line);
  if (lineNo === undefined) {
    throw Error("Could not detect the present cursor line No.");
  }
  const index = Math.round(
    (lineNo + getVisibleLineCount() / 2) * count,
  );
  await goLine(Math.min(index, getLineCount() - 1));
};
/** 1ページ上にスクロールする
 *
 * @param [count=1] スクロール回数
 */
export const scrollUp = (count = 1): void => {
  for (const _ of range(0, count)) {
    press("PageUp");
  }
};
/** 1ページ下にスクロールする
 *
 * @param [count=1] スクロール回数
 */
export const scrollDown = (count = 1): void => {
  for (const _ of range(0, count)) {
    press("PageDown");
  }
};
