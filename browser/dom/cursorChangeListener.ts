import type { Scrapbox } from "@cosense/types/userscript";
import { cursor } from "./dom.ts";
declare const scrapbox: Scrapbox;

const target = /* @__PURE__ */ new EventTarget();

let initialize: (() => void) | undefined = () => {
  const observer = new MutationObserver(() => {
    target.dispatchEvent(new Event("change"));
  });
  const observe = () => {
    observer.disconnect();
    const cursorEl = cursor();
    if (!cursorEl) return;
    observer.observe(cursorEl, {
      attributes: true,
      attributeFilter: ["style"],
    });
  };
  observe();
  scrapbox.on("layout:changed", observe);
  initialize = undefined;
};

/** Register a listener that fires when the editor cursor moves
 *
 * @param listener - The callback to invoke when the cursor position changes
 * @param options - Standard addEventListener options or boolean for useCapture
 */
export const addCursorChangeListener = (
  listener: EventListenerOrEventListenerObject,
  options?: boolean | AddEventListenerOptions,
): void => {
  initialize?.();
  target.addEventListener("change", listener, options);
};

/** Remove a listener registered with {@linkcode addCursorChangeListener}
 *
 * @param listener - The callback to remove
 * @param options - Standard removeEventListener options or boolean for useCapture
 */
export const removeCursorChangeListener = (
  listener: EventListenerOrEventListenerObject,
  options?: boolean | EventListenerOptions,
): void => {
  target.removeEventListener("change", listener, options);
};
