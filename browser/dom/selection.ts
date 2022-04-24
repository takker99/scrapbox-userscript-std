/// <reference no-default-lib="true"/>
/// <reference lib="esnext"/>
/// <reference lib="dom" />

import { takeStores } from "./stores.ts";
import { Selection } from "./selection.d.ts";

export const takeSelection = (): Selection => {
  for (const store of takeStores()) {
    if ("hasSelection" in store) return store;
  }
  throw Error('#text-input must has a "Selection" store.');
};
