import type { Scrapbox } from "@cosense/types/userscript";
import { editor, selections } from "./dom.ts";
declare const scrapbox: Scrapbox;

const target = /* @__PURE__ */ new EventTarget();

const isSelectionsElement = (node: Node): node is HTMLDivElement =>
  node instanceof HTMLDivElement && node.classList.contains("selections");

let initialize: (() => void) | undefined = () => {
  const selectionsObserver = new MutationObserver(() => {
    target.dispatchEvent(new Event("change"));
  });
  const observeSelections = (el: HTMLDivElement) => {
    selectionsObserver.disconnect();
    selectionsObserver.observe(el, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["style"],
    });
  };

  // Cosense mounts div.selections under div#editor only while text is selected
  // and removes it when the selection is cleared.
  const editorObserver = new MutationObserver((records) => {
    let changed = false;
    for (const record of records) {
      for (const node of record.removedNodes) {
        if (isSelectionsElement(node)) {
          selectionsObserver.disconnect();
          changed = true;
        }
      }
      for (const node of record.addedNodes) {
        if (isSelectionsElement(node)) {
          observeSelections(node);
          changed = true;
        }
      }
    }
    if (changed) {
      target.dispatchEvent(new Event("change"));
    }
  });

  const observe = () => {
    editorObserver.disconnect();
    selectionsObserver.disconnect();
    const editorEl = editor();
    if (!editorEl) return;
    editorObserver.observe(editorEl, { childList: true });
    const selectionsEl = selections();
    if (selectionsEl) {
      observeSelections(selectionsEl);
    }
  };
  observe();
  scrapbox.on("layout:changed", observe);
  initialize = undefined;
};

/** Register a listener that fires when the editor text selection changes
 *
 * @param listener - The callback to invoke when the selection changes
 * @param options - Standard addEventListener options or boolean for useCapture
 */
export const addSelectionChangeListener = (
  listener: EventListenerOrEventListenerObject,
  options?: boolean | AddEventListenerOptions,
): void => {
  initialize?.();
  target.addEventListener("change", listener, options);
};

/** Remove a listener registered with {@linkcode addSelectionChangeListener}
 *
 * @param listener - The callback to remove
 * @param options - Standard removeEventListener options or boolean for useCapture
 */
export const removeSelectionChangeListener = (
  listener: EventListenerOrEventListenerObject,
  options?: boolean | EventListenerOptions,
): void => {
  target.removeEventListener("change", listener, options);
};
