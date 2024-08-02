import { takeStores } from "./stores.ts";
import type { Cursor } from "./cursor.d.ts";
export type { Cursor };

export const takeCursor = (): Cursor => takeStores().cursor;
