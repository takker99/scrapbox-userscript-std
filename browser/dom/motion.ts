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
import { range } from "@core/iterutil/range";

/** @deprecated
 * Long press at the end of cursor line to gain focus
 *
 * This function is specifically for mobile version of Scrapbox
 *
 * @param [holding=1000] - Duration of long press in milliseconds
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

/** Move the cursor left using `ArrowLeft` key
 *
 * @param [count=1] - Number of moves to perform
 */
export const moveLeft = (count = 1): void => {
  for (const _ of range(1, count)) {
    press("ArrowLeft");
  }
};
/** Move the cursor up using `ArrowUp` key
 *
 * @param [count=1] - Number of moves to perform
 */
export const moveUp = (count = 1): void => {
  for (const _ of range(1, count)) {
    press("ArrowUp");
  }
};
/** Move the cursor down using `ArrowDown` key
 *
 * @param [count=1] - Number of moves to perform
 */
export const moveDown = (count = 1): void => {
  for (const _ of range(1, count)) {
    press("ArrowDown");
  }
};
/** Move the cursor right using `ArrowRight` key
 *
 * @param [count=1] - Number of moves to perform
 */
export const moveRight = (count = 1): void => {
  for (const _ of range(1, count)) {
    press("ArrowRight");
  }
};

/** Move to the start of line excluding indentation */
export const goHeadWithoutBlank = (): void => {
  press("End");
  press("Home");
};
/** Move to the last non-whitespace character */
export const goEndWithoutBlank = (): void => {
  press("End");
  moveLeft(
    getText(caret().position.line)?.match?.(/(\s*)$/)?.[1]?.length ?? 0,
  );
};
/** Move to the start of line */
export const goHead = (): void => {
  press("Home");
  press("Home");
};
/** Move to the end of line */
export const goEnd = (): void => {
  press("End");
};

/** Move to the start of the first line */
export const goHeadLine = async (): Promise<void> => {
  const target = getHeadLineDOM();
  if (!target) throw Error(".line:first-of-type can't be found.");
  if (!isHeightViewable(target)) target.scrollIntoView({ block: "center" });

  const charDOM = getHeadCharDOM(target);
  if (!charDOM) throw Error(".line:first-of-type .c-0 can't be found.");
  const { left, top } = charDOM.getBoundingClientRect();
  await click(target, { X: left, Y: top });
};
/** Move to the end of the last line */
export const goLastLine = async (): Promise<void> => {
  await _goLine(getTailLineDOM());
};
/** Move to the end of a specified line
 *
 * @param value - Target line number, line ID, or {@linkcode HTMLElement}
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

/** Move cursor to a specific character position
 *
 * Note: This operation will fail if attempting to move to characters that cannot be clicked in the UI
 *
 * @param line - Target line (can be line number, line ID, or line DOM element)
 * @param pos - Character position (column) in the target line
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

/** Calculate the maximum number of lines that can fit in the viewport
 *
 * Uses the height of the last line as a reference for calculation
 */
const getVisibleLineCount = (): number => {
  const clientHeight = getTailLineDOM()?.clientHeight;
  if (clientHeight === undefined) {
    throw Error("Could not find .line:last-of-type");
  }
  return Math.round(globalThis.innerHeight / clientHeight);
};

/** Scroll half a page up
 *
 * @param [count=1] - Number of scroll operations to perform
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
/** Scroll half a page down
 *
 * @param [count=1] - Number of scroll operations to perform
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
/** Scroll one page up using `PageUp` key
 *
 * @param [count=1] - Number of scroll operations to perform
 */
export const scrollUp = (count = 1): void => {
  for (const _ of range(1, count)) {
    press("PageUp");
  }
};
/** Scroll one page down using `PageDown` key
 *
 * @param [count=1] - Number of scroll operations to perform
 */
export const scrollDown = (count = 1): void => {
  for (const _ of range(1, count)) {
    press("PageDown");
  }
};
