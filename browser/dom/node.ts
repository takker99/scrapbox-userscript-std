import { isArray } from "@core/unknownutil/is/array";
import { isNumber } from "@core/unknownutil/is/number";
import { isString } from "@core/unknownutil/is/string";
import { ensure } from "@core/unknownutil/ensure";
import { isUndefined } from "@core/unknownutil/is/undefined";
import { getCachedLines } from "./getCachedLines.ts";
import { takeInternalLines } from "./takeInternalLines.ts";
import type { BaseLine, Line } from "@cosense/types/userscript";
import { lines } from "./dom.ts";
import * as Text from "../../text.ts";

/** Get the line id from value
 *
 * If the line id can't be found, return `undefined`
 *
 * @param value - value the line id of which you want to get
 */
export const getLineId = <T extends HTMLElement>(
  value?: number | string | T,
): string | undefined => {
  if (isUndefined(value)) return undefined;

  // When value is a line number
  if (isNumber(value)) return getBaseLine(value)?.id;
  // When value is a line ID
  if (isString(value)) return value.startsWith("L") ? value.slice(1) : value;

  // When value is a line DOM element
  if (value.classList.contains("line")) return value.id.slice(1);
  // When value is a child element of a line
  const line = value.closest(".line");
  if (line) return line.id.slice(1);

  return undefined;
};

/** Get the line number from value
 *
 * If the line number can't be found, return `undefined`
 *
 * @param value - value the line number of which you want to get
 */
export const getLineNo = <T extends HTMLElement>(
  value?: number | string | T,
): number | undefined => {
  if (isUndefined(value)) return undefined;

  // When value is a line number
  if (isNumber(value)) return value;
  // When value is a line ID or DOM element
  const id = getLineId(value);
  return id ? takeInternalLines().findIndex((line) => line.id === id) : -1;
};

export const getLine = <T extends HTMLElement>(
  value?: number | string | T,
): Line | undefined => {
  if (isUndefined(value)) return undefined;

  // When value is a line number
  if (isNumber(value)) return getLines()[value];
  // When value is a line ID or DOM element
  const id = getLineId(value);
  return id ? getLines().find((line) => line.id === id) : undefined;
};

export const getBaseLine = <T extends HTMLElement>(
  value?: number | string | T,
): BaseLine | undefined => {
  if (isUndefined(value)) return undefined;

  // When value is a line number
  if (isNumber(value)) return takeInternalLines()[value];
  // When value is a line ID or DOM element
  const id = getLineId(value);
  return id ? takeInternalLines().find((line) => line.id === id) : undefined;
};

export const getLineDOM = <T extends HTMLElement>(
  value?: number | string | T,
): HTMLDivElement | undefined => {
  if (isLineDOM(value)) return value;

  const id = getLineId(value);
  if (isUndefined(id)) return id;
  const line = document.getElementById(`L${id}`);
  if (isUndefined(line)) return undefined;
  return line as HTMLDivElement;
};
export const isLineDOM = (dom: unknown): dom is HTMLDivElement =>
  dom instanceof HTMLDivElement && dom.classList.contains("line");

export const getLineCount = (): number => takeInternalLines().length;

export const getLines = (): readonly Line[] => {
  const lines = ensure(getCachedLines(), isArray);
  return lines as Line[];
};

export const getText = <T extends HTMLElement>(
  value?: number | string | T,
): string | undefined => {
  if (isUndefined(value)) return undefined;

  // Treat numbers and strings as line references
  if (isNumber(value) || isString(value)) return getBaseLine(value)?.text;
  if (!(value instanceof HTMLElement)) return;
  if (isLineDOM(value)) return getBaseLine(value)?.text;
  // When value is a character DOM element
  if (value.classList.contains("char-index")) {
    return value.textContent ?? undefined;
  }
  // When the element contains `div.lines` (which contains multiple div.line elements), return all text content concatenated
  if (
    value.classList.contains("line") ||
    value.getElementsByClassName("lines")?.[0]
  ) {
    return takeInternalLines().map(({ text }) => text).join("\n");
  }
  // Get all character indices contained within the element and return the corresponding text
  const chars = [] as number[];
  const line = getBaseLine(value);
  if (isUndefined(line)) return;
  for (const dom of getChars(value)) {
    chars.push(getIndex(dom));
  }
  return line.text.slice(Math.min(...chars), Math.max(...chars) + 1);
};

export const getExternalLink = (dom: HTMLElement): HTMLElement | undefined => {
  const link = dom.closest(".link");
  if (isUndefined(link)) return undefined;
  return link as HTMLElement;
};
export const getInternalLink = (dom: HTMLElement): HTMLElement | undefined => {
  const link = dom.closest(".page-link");
  if (isUndefined(link)) return undefined;
  return link as HTMLElement;
};
export const getLink = (dom: HTMLElement): HTMLElement | undefined => {
  const link = dom.closest(".link, .page-link");
  if (isUndefined(link)) return undefined;
  return link as HTMLElement;
};

export const getFormula = (dom: HTMLElement): HTMLElement | undefined => {
  const formula = dom.closest(".formula");
  if (isUndefined(formula)) return undefined;
  return formula as HTMLElement;
};
export const getNextLine = <T extends HTMLElement>(
  value?: number | string | T,
): Line | undefined => {
  const index = getLineNo(value);
  if (isUndefined(index)) return undefined;

  return getLine(index + 1);
};

export const getPrevLine = <T extends HTMLElement>(
  value?: number | string | T,
): Line | undefined => {
  const index = getLineNo(value);
  if (isUndefined(index)) return undefined;

  return getLine(index - 1);
};

export const getHeadLineDOM = (): HTMLDivElement | undefined => {
  const line = lines()?.firstElementChild;
  if (isUndefined(line)) return undefined;
  return line as HTMLDivElement;
};
export const getTailLineDOM = (): HTMLDivElement | undefined => {
  const line = lines()?.lastElementChild;
  if (isUndefined(line)) return undefined;
  return line as HTMLDivElement;
};
export const getIndentCount = <T extends HTMLElement>(
  value?: number | string | T,
): number | undefined => {
  const text = getText(value);
  if (isUndefined(text)) return undefined;
  return Text.getIndentCount(text);
};
/** Get the number of indented lines under the specified line
 *
 * @param value Line reference (can be line number, line ID, or DOM element)
 */
export const getIndentLineCount = <T extends HTMLElement>(
  value?: number | string | T,
): number | undefined => {
  const index = getLineNo(value);
  if (isUndefined(index)) return;
  return Text.getIndentLineCount(index, getLines());
};

export function* getChars<T extends HTMLElement>(
  value: T,
): Generator<HTMLSpanElement, void, unknown> {
  const chars = value.getElementsByClassName("char-index");
  for (let i = 0; i < chars.length; i++) {
    yield chars[0] as HTMLSpanElement;
  }
}

export const isCharDOM = (dom: unknown): dom is HTMLSpanElement => {
  return dom instanceof HTMLSpanElement && dom.classList.contains("char-index");
};

export const getIndex = (dom: HTMLSpanElement): number => {
  if (!isCharDOM(dom)) throw Error("A char DOM is required.");

  const index = dom.className.match(/c-(\d+)/)?.[1];
  if (isUndefined(index)) throw Error('.char-index must have ".c-{\\d}"');
  return parseInt(index);
};
export const getHeadCharDOM = (
  dom?: HTMLElement,
): HTMLSpanElement | undefined => {
  const char = dom?.getElementsByClassName?.("c-0")?.[0];
  return isCharDOM(char) ? char : undefined;
};

export const getTailCharDOM = (
  dom?: HTMLElement,
): HTMLSpanElement | undefined => {
  const char = dom?.querySelector(".char-index:last-of-type");
  return isCharDOM(char) ? char : undefined;
};

export const getCharDOM = <T extends HTMLElement>(
  line: string | number | T,
  pos: number,
): HTMLSpanElement | undefined => {
  const char = getLineDOM(line)?.getElementsByClassName?.(`c-${pos}`)?.[0];
  return isCharDOM(char) ? char : undefined;
};
export const getDOMFromPoint = (
  x: number,
  y: number,
): { char?: HTMLSpanElement; line?: HTMLDivElement } => {
  const targets = document.elementsFromPoint(x, y);
  const char = targets.find((target) => isCharDOM(target));
  const line = targets.find((target) => isLineDOM(target));
  return {
    char: isUndefined(char) ? undefined : char as HTMLSpanElement,
    line: isUndefined(line) ? undefined : line as HTMLDivElement,
  };
};
