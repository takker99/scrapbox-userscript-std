import { textInput } from "./dom.ts";

/** the options for `press()` */
export interface PressOptions {
  shiftKey?: boolean;
  ctrlKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  noModifiedKeys?: boolean;
}

/** Dispatches a keyboard event programmatically via JavaScript
 *
 * Used to send keyboard input commands to Scrapbox.
 * > [!NOTE]
 * > This function appears to block synchronously until Scrapbox's event listeners
 * finish processing the keyboard event.
 *
 * @param key - The name of the key to simulate pressing
 * @param pressOptions - Additional options for the key press (modifiers, etc.)
 */
export const press = (
  key: KeyName,
  pressOptions?: PressOptions,
): void => {
  const { noModifiedKeys = false, ...rest } = pressOptions ?? {};
  const options = {
    bubbles: true,
    cancelable: true,
    keyCode: KEYCODE_MAP[key],
    ...(noModifiedKeys ? {} : { ...rest }),
  };
  const textarea = textInput();
  if (!textarea) throw Error("#text-input must exist.");
  textarea.dispatchEvent(new KeyboardEvent("keydown", options));
  textarea.dispatchEvent(new KeyboardEvent("keyup", options));
};

export type KeyName = keyof typeof KEYCODE_MAP;
const KEYCODE_MAP = {
  Backspace: 8,
  Tab: 9,
  Enter: 13,
  Delete: 46,
  Escape: 27,
  " ": 32,
  PageUp: 33,
  PageDown: 34,
  End: 35,
  Home: 36,
  ArrowLeft: 37,
  ArrowUp: 38,
  ArrowRight: 39,
  ArrowDown: 40,
  // alphabets
  a: 65,
  A: 65,
  b: 66,
  B: 66,
  c: 67,
  C: 67,
  d: 68,
  D: 68,
  e: 69,
  E: 69,
  f: 70,
  F: 70,
  g: 71,
  G: 71,
  h: 72,
  H: 72,
  i: 73,
  I: 73,
  j: 74,
  J: 74,
  k: 75,
  K: 75,
  l: 76,
  L: 76,
  m: 77,
  M: 77,
  n: 78,
  N: 78,
  o: 79,
  O: 79,
  p: 80,
  P: 80,
  q: 81,
  Q: 81,
  r: 82,
  R: 82,
  s: 83,
  S: 83,
  t: 84,
  T: 84,
  u: 85,
  U: 85,
  v: 86,
  V: 86,
  w: 87,
  W: 87,
  x: 88,
  X: 88,
  y: 89,
  Y: 89,
  z: 90,
  Z: 90,
  // number
  0: 48,
  1: 49,
  2: 50,
  3: 51,
  4: 52,
  5: 53,
  6: 54,
  7: 55,
  8: 56,
  9: 57,
  // function keys
  F1: 113,
  F2: 114,
  F3: 115,
  F4: 116,
  F5: 117,
  F6: 118,
  F7: 119,
  F8: 120,
  F9: 121,
  F10: 122,
  F11: 123,
  F12: 124,
  // Symbols and special characters
  ":": 186,
  "*": 186,
  ";": 187,
  "+": 187,
  "-": 189,
  "=": 189,
  ".": 190,
  ">": 190,
  "/": 191,
  "?": 191,
  "@": 192,
  "`": 192,
  "[": 219,
  "{": 219,
  "\\": 220,
  "|": 220,
  "]": 221,
  "}": 221,
  "^": 222,
  "~": 222,
  "_": 226, // Note: Without Shift, keyCode 226 represents '\' and cannot be distinguished from the backslash key
};
