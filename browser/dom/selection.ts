import { takeStores } from "./stores.ts";
import type { Selection } from "./selection.d.ts";
export type { Selection };

export const takeSelection = (): Selection => takeStores().selection;
