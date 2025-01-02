import { delay } from "@std/async/delay";

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
export const click = async (
  element: HTMLElement,
  options: ClickOptions,
): Promise<void> => {
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

  // Wait for Scrapbox's React event handlers to complete
  // Note: 10ms delay is determined empirically to ensure reliable event processing
  await delay(10);
};

export interface HoldDownOptions extends ClickOptions {
  holding?: number;
}

/** Emulate long tap event sequence */
export const holdDown = async (
  element: HTMLElement,
  options: HoldDownOptions,
): Promise<void> => {
  const touch = new Touch({
    identifier: 0,
    target: element,
    clientX: options.X,
    clientY: options.Y,
    pageX: options.X + globalThis.scrollX,
    pageY: options.Y + globalThis.scrollY,
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
  await delay(options.holding ?? 1000);
  element.dispatchEvent(new MouseEvent("mouseup", mouseOptions));
  element.dispatchEvent(new TouchEvent("touchend", mouseOptions));
  element.dispatchEvent(new MouseEvent("click", mouseOptions));

  // Wait for Scrapbox's React event handlers to complete
  // Note: 10ms delay is determined empirically to ensure reliable event processing
  await delay(10);
};
