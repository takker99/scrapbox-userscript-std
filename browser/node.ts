/// <reference no-default-lib="true"/>
/// <reference lib="esnext"/>
/// <reference lib="dom" />
import { isNone, isNumber, isString } from "../is.ts";
import { ensureArray } from "../ensure.ts";
import type { Scrapbox } from "../deps/scrapbox.ts";
import { lines } from "./dom.ts";
import * as Text from "../text.ts";
declare const scrapbox: Scrapbox;

/** Get the line id from value
 *
 * If the line id can't be found, return `undefined`
 *
 * @param value - value the line id of which you want to get
 */
export function getLineId<T extends HTMLElement>(
  value?: number | string | T,
): string | undefined {
  if (isNone(value)) return undefined;

  // 行番号のとき
  if (isNumber(value)) {
    return getLine(value)?.id;
  }
  // 行IDのとき
  if (isString(value)) return value.startsWith("L") ? value.slice(1) : value;

  // 行のDOMだったとき
  if (value.classList.contains("line")) return value.id.slice(1);
  // 行の子要素だったとき
  const line = value.closest(".line");
  if (line) return line.id.slice(1);

  return undefined;
}

/** Get the line number from value
 *
 * If the line number can't be found, return `undefined`
 *
 * @param value - value the line number of which you want to get
 */
export function getLineNo<T extends HTMLElement>(value?: number | string | T) {
  if (isNone(value)) return undefined;

  // 行番号のとき
  if (isNumber(value)) return value;
  // 行ID or DOMのとき
  const id = getLineId(value);
  return id ? getLines().findIndex((line) => line.id === id) : -1;
}

export function getLine<T extends HTMLElement>(value?: number | string | T) {
  if (isNone(value)) return undefined;

  // 行番号のとき
  if (isNumber(value)) {
    return getLines()[value];
  }
  // 行ID or DOMのとき
  const id = getLineId(value);
  return id ? getLines().find((line) => line.id === id) : undefined;
}

export function getLineDOM<T extends HTMLElement>(value?: number | string | T) {
  if (isLineDOM(value)) return value;

  const id = getLineId(value);
  if (isNone(id)) return id;
  const line = document.getElementById(`L${id}`);
  if (isNone(line)) return undefined;
  return line as HTMLDivElement;
}
export function isLineDOM(dom: unknown): dom is HTMLDivElement {
  return dom instanceof HTMLDivElement && dom.classList.contains("line");
}
export function getLineCount() {
  return getLines().length;
}

export function getLines() {
  ensureArray(scrapbox.Page.lines, "scrapbox.Page.lines");
  return scrapbox.Page.lines;
}

export function getText<T extends HTMLElement>(value?: number | string | T) {
  if (isNone(value)) return undefined;

  // 数字と文字列は行として扱う
  if (isNumber(value) || isString(value)) return getLine(value)?.text;
  if (!(value instanceof HTMLElement)) return;
  if (isLineDOM(value)) return getLine(value)?.text;
  // 文字のDOMだったとき
  if (value.classList.contains("char-index")) {
    return value.textContent ?? undefined;
  }
  // div.linesを含む(複数のdiv.lineを含む)場合は全ての文字列を返す
  if (
    value.classList.contains("line") ||
    value.getElementsByClassName("lines")?.[0]
  ) {
    return getLines().map(({ text }) => text).join("\n");
  }
  //中に含まれている文字の列番号を全て取得し、それに対応する文字列を返す
  const chars = [] as number[];
  const line = getLine(value);
  if (isNone(line)) return;
  for (const dom of getChars(value)) {
    chars.push(getIndex(dom));
  }
  return line.text.slice(Math.min(...chars), Math.max(...chars) + 1);
}

export function getExternalLink(dom: HTMLElement) {
  const link = dom.closest(".link");
  if (isNone(link)) return undefined;
  return link as HTMLElement;
}
export function getInternalLink(dom: HTMLElement) {
  const link = dom.closest(".page-link");
  if (isNone(link)) return undefined;
  return link as HTMLElement;
}
export function getLink(dom: HTMLElement) {
  const link = dom.closest(".link, .page-link");
  if (isNone(link)) return undefined;
  return link as HTMLElement;
}

export function getFormula(dom: HTMLElement) {
  const formula = dom.closest(".formula");
  if (isNone(formula)) return undefined;
  return formula as HTMLElement;
}
export function getNextLine<T extends HTMLElement>(
  value?: number | string | T,
) {
  const index = getLineNo(value);
  if (isNone(index)) return undefined;

  return getLine(index + 1);
}

export function getPrevLine<T extends HTMLElement>(
  value?: number | string | T,
) {
  const index = getLineNo(value);
  if (isNone(index)) return undefined;

  return getLine(index - 1);
}

export function getHeadLineDOM() {
  const line = lines()?.firstElementChild;
  if (isNone(line)) return undefined;
  return line as HTMLDivElement;
}
export function getTailLineDOM() {
  const line = lines()?.lastElementChild;
  if (isNone(line)) return undefined;
  return line as HTMLDivElement;
}
export function getIndentCount<T extends HTMLElement>(
  value?: number | string | T,
) {
  const text = getText(value);
  if (isNone(text)) return undefined;
  return Text.getIndentCount(text);
}
/** 指定した行の配下にある行の数を返す
 *
 * @param value 指定したい行の行番号か行IDかDOM
 */
export function getIndentLineCount<T extends HTMLElement>(
  value?: number | string | T,
) {
  const index = getLineNo(value);
  if (isNone(index)) return;
  return Text.getIndentLineCount(index, getLines());
}

export function* getChars<T extends HTMLElement>(value: T) {
  const chars = value.getElementsByClassName("char-index");
  for (let i = 0; i < chars.length; i++) {
    yield chars[0] as HTMLSpanElement;
  }
}

export function isCharDOM(dom: unknown): dom is HTMLSpanElement {
  return dom instanceof HTMLSpanElement && dom.classList.contains("char-index");
}

export function getIndex(dom: HTMLSpanElement) {
  if (!isCharDOM(dom)) throw Error("A char DOM is required.");

  const index = dom.className.match(/c-(\d+)/)?.[1];
  if (isNone(index)) throw Error('.char-index must have ".c-{\\d}"');
  return parseInt(index);
}
export function getHeadCharDOM(dom?: HTMLElement) {
  const char = dom?.getElementsByClassName?.("c-0")?.[0];
  return isCharDOM(char) ? char : undefined;
}

export function getTailCharDOM(dom?: HTMLElement) {
  const char = dom?.querySelector(".char-index:last-of-type");
  return isCharDOM(char) ? char : undefined;
}

export function getCharDOM<T extends HTMLElement>(
  line: string | number | T,
  pos: number,
) {
  const char = getLineDOM(line)?.getElementsByClassName?.(`c-${pos}`)?.[0];
  return isCharDOM(char) ? char : undefined;
}
export function getDOMFromPoint(x: number, y: number) {
  const targets = document.elementsFromPoint(x, y);
  const char = targets.find((target) => isCharDOM(target));
  const line = targets.find((target) => isLineDOM(target));
  return {
    char: isNone(char) ? undefined : char as HTMLSpanElement,
    line: isNone(line) ? undefined : line as HTMLDivElement,
  };
}
