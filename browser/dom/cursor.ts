import { takeStores } from "./stores.ts";
import type { Cursor } from "./cursor.d.ts";
export type { Cursor };

/** Retrieve the internal Cursor store instance
 *
 * @deprecated Cosense does not attach `__reactFiber` to DOM elements, so this function always throws. Use `scrapbox.Page.cursor` and `addCursorChangeListener` instead.
 */
export const takeCursor = (): Cursor => takeStores().cursor;
