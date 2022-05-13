/// <reference no-default-lib="true"/>
/// <reference lib="esnext"/>
/// <reference lib="dom" />

import { takeStores } from "./stores.ts";
import { Selection } from "./selection.d.ts";

export const takeSelection = (): Selection => takeStores().selection;
