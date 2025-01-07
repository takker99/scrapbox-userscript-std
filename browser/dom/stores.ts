import { textInput } from "./dom.ts";
import type { Cursor } from "./cursor.d.ts";
import type { Selection } from "./selection.d.ts";
export type { Cursor, Selection };

/** Retrieve Scrapbox's internal cursor and selection stores from the DOM
 *
 * This function accesses React's internal fiber tree to obtain references to
 * the Cursor and Selection store instances that Scrapbox uses to manage
 * text input state. These stores provide APIs for:
 * - Cursor: Managing text cursor position and movement
 * - Selection: Handling text selection ranges and operations
 *
 * @throws {Error} If text input element or stores cannot be found
 * @returns Object containing cursor and selection store instances
 */
export const takeStores = (): { cursor: Cursor; selection: Selection } => {
  const textarea = textInput();
  if (!textarea) {
    throw Error(`#text-input is not found.`);
  }

  const reactKey = Object.keys(textarea)
    .find((key) => key.startsWith("__reactFiber"));
  if (!reactKey) {
    throw Error(
      '#text-input must has the property whose name starts with "__reactFiber"',
    );
  }

  // @ts-ignore Treating DOM element as an object to access React's internal fiber tree.
  // This is a hack to access Scrapbox's internal stores, but it's currently the only way
  // to obtain references to the cursor and selection management instances.
  const stores = (textarea[
    reactKey
  ] as ReactFiber).return.return.stateNode._stores as (Cursor | Selection)[];

  const cursor = stores.find((store) =>
    store.constructor.name === "Cursor"
  ) as (Cursor | undefined);
  if (!cursor) {
    throw Error('#text-input must has a "Cursor" store.');
  }
  const selection = stores.find((store) =>
    store.constructor.name === "Selection"
  ) as (Selection | undefined);
  if (!selection) {
    throw Error('#text-input must has a "Selection" store.');
  }

  return { cursor, selection };
};

/** Internal React Fiber node structure
 *
 * This interface represents the minimal structure we need from React's
 * internal fiber tree to access Scrapbox's store instances. Note that
 * this is an implementation detail and might change with React updates.
 */
interface ReactFiber {
  return: {
    return: {
      stateNode: {
        _stores: (Cursor | Selection)[];
      };
    };
  };
}
