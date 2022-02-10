/// <reference no-default-lib="true"/>
/// <reference lib="esnext"/>
/// <reference lib="dom" />

import { sleep } from "../sleep.ts";

/** the options for `click()` */
export interface ClickOptions {
  button?: number;
  X: number;
  Y: number;
  shiftKey?: boolean;
  ctrlKey?: boolean;
  altKey?: boolean;
}

/** Emulate click event sequences */
export async function click(
  element: HTMLElement,
  options: ClickOptions,
): Promise<void> {
  const mouseOptions: MouseEventInit = {
    button: options.button ?? 0,
    clientX: options.X,
    clientY: options.Y,
    bubbles: true,
    cancelable: true,
    shiftKey: options.shiftKey,
    ctrlKey: options.ctrlKey,
    altKey: options.altKey,
    view: window,
  };
  element.dispatchEvent(new MouseEvent("mousedown", mouseOptions));
  element.dispatchEvent(new MouseEvent("mouseup", mouseOptions));
  element.dispatchEvent(new MouseEvent("click", mouseOptions));

  // ScrapboxのReactの処理が終わるまで少し待つ
  // 待ち時間は感覚で決めた
  await sleep(10);
}

export interface HoldDownOptions extends ClickOptions {
  holding?: number;
}

/** Emulate long tap event sequence */
export async function holdDown(
  element: HTMLElement,
  options: HoldDownOptions,
): Promise<void> {
  const touch = new Touch({
    identifier: 0,
    target: element,
    clientX: options.X,
    clientY: options.Y,
    pageX: options.X + window.scrollX,
    pageY: options.Y + window.scrollY,
  });
  const mouseOptions = {
    button: options.button ?? 0,
    clientX: options.X,
    clientY: options.Y,
    changedTouches: [touch],
    touches: [touch],
    bubbles: true,
    cancelable: true,
    shiftKey: options.shiftKey,
    ctrlKey: options.ctrlKey,
    altKey: options.altKey,
    view: window,
  };
  element.dispatchEvent(new TouchEvent("touchstart", mouseOptions));
  element.dispatchEvent(new MouseEvent("mousedown", mouseOptions));
  await sleep(options.holding ?? 1000);
  element.dispatchEvent(new MouseEvent("mouseup", mouseOptions));
  element.dispatchEvent(new TouchEvent("touchend", mouseOptions));
  element.dispatchEvent(new MouseEvent("click", mouseOptions));

  // ScrapboxのReactの処理が終わるまで少し待つ
  // 待ち時間は感覚で決めた
  await sleep(10);
}
