import { goHead, goLine } from "./motion.ts";
import { press } from "./press.ts";
import { getLineCount } from "./node.ts";
import { range } from "../../range.ts";
import { textInput } from "./dom.ts";
import { isArray } from "@core/unknownutil/is/array";
import { isNumber } from "@core/unknownutil/is/number";
import { isString } from "@core/unknownutil/is/string";
import { delay } from "@std/async/delay";

export const undo = (count = 1): void => {
  for (const _ of range(0, count)) {
    press("z", { ctrlKey: true });
  }
};
export const redo = (count = 1): void => {
  for (const _ of range(0, count)) {
    press("z", { shiftKey: true, ctrlKey: true });
  }
};

export const insertIcon = (count = 1): void => {
  for (const _ of range(0, count)) {
    press("i", { ctrlKey: true });
  }
};

export const insertTimestamp = (index = 1): void => {
  for (const _ of range(0, index)) {
    press("t", { altKey: true });
  }
};

export const insertLine = async (
  lineNo: number,
  text: string,
): Promise<void> => {
  await goLine(lineNo);
  goHead();
  press("Enter");
  press("ArrowUp");
  await insertText(text);
};

export const replaceLines = async (
  start: number,
  end: number,
  text: string,
): Promise<void> => {
  await goLine(start);
  goHead();
  for (const _ of range(start, end)) {
    press("ArrowDown", { shiftKey: true });
  }
  press("End", { shiftKey: true });
  await insertText(text);
};

export const deleteLines = async (
  from: number | string | string[],
  count = 1,
): Promise<void> => {
  if (isNumber(from)) {
    if (getLineCount() === from + count) {
      await goLine(from - 1);
      press("ArrowRight", { shiftKey: true });
    } else {
      await goLine(from);
      goHead();
    }
    for (let i = 0; i < count; i++) {
      press("ArrowRight", { shiftKey: true });
      press("End", { shiftKey: true });
    }
    press("ArrowRight", { shiftKey: true });
    press("Delete");
    return;
  }
  if (isString(from) || isArray(from)) {
    const ids = Array.isArray(from) ? from : [from];
    for (const id of ids) {
      await goLine(id);
      press("Home", { shiftKey: true });
      press("Home", { shiftKey: true });
      press("Backspace");
      press("Backspace");
    }
    return;
  }
  throw new TypeError(
    `The type of value must be number | string | string[] but actual is "${typeof from}"`,
  );
};

export const indentLines = (count = 1): void => {
  for (const _ of range(0, count)) {
    press("ArrowRight", { ctrlKey: true });
  }
};
export const outdentLines = (count = 1): void => {
  for (const _ of range(0, count)) {
    press("ArrowLeft", { ctrlKey: true });
  }
};
export const moveLines = (count: number): void => {
  if (count > 0) {
    downLines(count);
  } else {
    upLines(-count);
  }
};
// Move selected lines to the position after the target line number
export const moveLinesBefore = (from: number, to: number): void => {
  const count = to - from;
  if (count >= 0) {
    downLines(count);
  } else {
    upLines(-count - 1);
  }
};
export const upLines = (count = 1): void => {
  for (const _ of range(0, count)) {
    press("ArrowUp", { ctrlKey: true });
  }
};
export const downLines = (count = 1): void => {
  for (const _ of range(0, count)) {
    press("ArrowDown", { ctrlKey: true });
  }
};

export const indentBlocks = (count = 1): void => {
  for (const _ of range(0, count)) {
    press("ArrowRight", { altKey: true });
  }
};
export const outdentBlocks = (count = 1): void => {
  for (const _ of range(0, count)) {
    press("ArrowLeft", { altKey: true });
  }
};
export const moveBlocks = (count: number): void => {
  if (count > 0) {
    downBlocks(count);
  } else {
    upBlocks(-count);
  }
};
export const upBlocks = (count = 1): void => {
  for (const _ of range(0, count)) {
    press("ArrowUp", { altKey: true });
  }
};
export const downBlocks = (count = 1): void => {
  for (const _ of range(0, count)) {
    press("ArrowDown", { altKey: true });
  }
};

export const insertText = async (text: string): Promise<void> => {
  const cursor = textInput();
  if (!cursor) {
    throw Error("#text-input is not ditected.");
  }
  cursor.focus();
  cursor.value = text;

  const event = new InputEvent("input", { bubbles: true });
  cursor.dispatchEvent(event);
  await delay(1); // 1ms delay to ensure event processing completes
};
