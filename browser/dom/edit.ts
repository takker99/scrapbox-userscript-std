import { goHead, goLine } from "./motion.ts";
import { press } from "./press.ts";
import { getLineCount } from "./node.ts";
import { range } from "../../range.ts";
import { textInput } from "./dom.ts";
import { isArray, isNumber, isString } from "../../is.ts";
import { sleep } from "../../sleep.ts";

export function undo(count = 1) {
  for (const _ of range(0, count)) {
    press("z", { ctrlKey: true });
  }
}
export function redo(count = 1) {
  for (const _ of range(0, count)) {
    press("z", { shiftKey: true, ctrlKey: true });
  }
}

export function insertTimestamp(index = 1) {
  for (const _ of range(0, index)) {
    press("t", { altKey: true });
  }
}

export async function insertLine(lineNo: number, text: string) {
  await goLine(lineNo);
  goHead();
  press("Enter");
  press("ArrowUp");
  await insertText(text);
}

export async function replaceLines(start: number, end: number, text: string) {
  await goLine(start);
  goHead();
  for (const _ of range(start, end)) {
    press("ArrowDown", { shiftKey: true });
  }
  press("End", { shiftKey: true });
  await insertText(text);
}

export async function deleteLines(from: number | string | string[], count = 1) {
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
}

export function indentLines(count = 1) {
  for (const _ of range(0, count)) {
    press("ArrowRight", { ctrlKey: true });
  }
}
export function outdentLines(count = 1) {
  for (const _ of range(0, count)) {
    press("ArrowLeft", { ctrlKey: true });
  }
}
export function moveLines(count: number) {
  if (count > 0) {
    downLines(count);
  } else {
    upLines(-count);
  }
}
// to行目の後ろに移動させる
export function moveLinesBefore(from: number, to: number) {
  const count = to - from;
  if (count >= 0) {
    downLines(count);
  } else {
    upLines(-count - 1);
  }
}
export function upLines(count = 1) {
  for (const _ of range(0, count)) {
    press("ArrowUp", { ctrlKey: true });
  }
}
export function downLines(count = 1) {
  for (const _ of range(0, count)) {
    press("ArrowDown", { ctrlKey: true });
  }
}

export function indentBlocks(count = 1) {
  for (const _ of range(0, count)) {
    press("ArrowRight", { altKey: true });
  }
}
export function outdentBlocks(count = 1) {
  for (const _ of range(0, count)) {
    press("ArrowLeft", { altKey: true });
  }
}
export function moveBlocks(count: number) {
  if (count > 0) {
    downBlocks(count);
  } else {
    upBlocks(-count);
  }
}
export function upBlocks(count = 1) {
  for (const _ of range(0, count)) {
    press("ArrowUp", { altKey: true });
  }
}
export function downBlocks(count = 1) {
  for (const _ of range(0, count)) {
    press("ArrowDown", { altKey: true });
  }
}

export async function insertText(text: string) {
  const cursor = textInput();
  if (!cursor) {
    throw Error("#text-input is not ditected.");
  }
  cursor.focus();
  cursor.value = text;

  const event = new InputEvent("input", { bubbles: true });
  cursor.dispatchEvent(event);
  await sleep(1); // 待ち時間は感覚で決めた
}
