/// <reference no-default-lib="true"/>
/// <reference lib="esnext"/>
/// <reference lib="dom" />

import { textInput } from "./dom.ts";
import { Cursor } from "./cursor.d.ts";
import { Selection } from "./selection.d.ts";

export const takeStores = (): (Cursor | Selection)[] => {
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
  return (textarea[
    reactKey
  ] as ReactFiber).return.return.stateNode._stores;
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
