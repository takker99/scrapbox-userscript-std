/// <reference no-default-lib="true"/>
/// <reference lib="esnext"/>
/// <reference lib="dom" />

import { textInput } from "./dom.ts";
import { Cursor } from "./cursor.d.ts";
import { Selection } from "./selection.d.ts";
export type { Cursor, Selection };

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

  // @ts-ignore DOMを無理矢理objectとして扱っている
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

interface ReactFiber {
  return: {
    return: {
      stateNode: {
        _stores: (Cursor | Selection)[];
      };
    };
  };
}
