/// <reference no-default-lib="true"/>
/// <reference lib="esnext"/>
/// <reference lib="dom" />

import { takeStores } from "./stores.ts";
import { Cursor } from "./cursor.d.ts";

export const takeCursor = (): Cursor => {
  for (const store of takeStores()) {
    if ("goByAction" in store) return store;
  }
  throw Error('#text-input must has a "Cursor" store.');
};
