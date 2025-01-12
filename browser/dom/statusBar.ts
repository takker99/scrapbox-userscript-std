import { statusBar } from "./dom.ts";

export interface UseStatusBarResult {
  /** Display information in the acquired status bar section
   *
   * @param items - Array of items to display (text, icons, or groups)
   */
  render: (...items: Item[]) => void;
  /** Remove the acquired status bar section and clean up resources */
  dispose: () => void;
}

/** Get a section of the status bar and return functions to manipulate it
 *
 * The status bar is divided into sections, each managed independently.
 * This hook creates a new section and provides methods to:
 * - Display information (text and icons) in the section
 * - Remove the section when it's no longer needed
 */
export const useStatusBar = (): UseStatusBarResult => {
  const bar = statusBar();
  if (!bar) throw new Error(`div.status-bar can't be found`);

  const status = document.createElement("div");
  bar.append(status);

  return {
    render: (...items: Item[]) => {
      status.textContent = "";
      const child = makeGroup(...items);
      if (child) status.append(child);
    },
    dispose: () => status.remove(),
  };
};

export interface ItemGroup {
  type: "group";
  items: Item[];
}
export type Item =
  | {
    type: "spinner" | "check-circle" | "exclamation-triangle";
  }
  | { type: "text"; text: string }
  | ItemGroup;

const makeGroup = (...items: Item[]): HTMLSpanElement | undefined => {
  const nodes = items.flatMap((item) => {
    switch (item.type) {
      case "spinner":
        return [makeSpinner()];
      case "check-circle":
        return [makeCheckCircle()];
      case "exclamation-triangle":
        return [makeExclamationTriangle()];
      case "text":
        return [makeItem(item.text)];
      case "group": {
        const group = makeGroup(...item.items);
        return group ? [group] : [];
      }
    }
  });
  if (nodes.length === 0) return;
  if (nodes.length === 1) return nodes[0];
  const span = document.createElement("span");
  span.classList.add("item-group");
  span.append(...nodes);
  return span;
};
const makeItem = (child: string | Node) => {
  const span = document.createElement("span");
  span.classList.add("item");
  span.append(child);
  return span;
};

/** Create a loading spinner icon
 *
 * Creates a FontAwesome spinner icon wrapped in a status bar item.
 * Use this to indicate loading or processing states.
 */
const makeSpinner = () => {
  const i = document.createElement("i");
  i.classList.add("fa", "fa-spinner");
  return makeItem(i);
};

/** Create a checkmark icon
 *
 * Creates a Kamon checkmark icon wrapped in a status bar item.
 * Use this to indicate successful completion or confirmation.
 */
const makeCheckCircle = () => {
  const i = document.createElement("i");
  i.classList.add("kamon", "kamon-check-circle");
  return makeItem(i);
};

/** Create a warning icon
 *
 * Creates a FontAwesome warning triangle icon wrapped in a status bar item.
 * Use this to indicate warnings, errors, or important notices.
 */
const makeExclamationTriangle = () => {
  const i = document.createElement("i");
  i.classList.add("fas", "fa-exclamation-triangle");
  return makeItem(i);
};
