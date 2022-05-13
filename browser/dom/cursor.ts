/// <reference no-default-lib="true"/>
/// <reference lib="esnext"/>
/// <reference lib="dom" />

import { takeStores } from "./stores.ts";
import { Cursor } from "./cursor.d.ts";

export const takeCursor = (): Cursor => takeStores().cursor;
