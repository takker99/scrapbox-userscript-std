import { takeStores } from "./stores.ts";
import type { Selection } from "./selection.d.ts";
export type { Selection };

/** Retrieve the internal Selection store instance
 *
 * @deprecated Cosense does not attach `__reactFiber` to DOM elements, so this function always throws. Use `scrapbox.Page.selection` and `addSelectionChangeListener` instead.
 */
export const takeSelection = (): Selection => takeStores().selection;
