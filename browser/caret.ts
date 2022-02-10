/// <reference no-default-lib="true"/>
/// <reference lib="esnext"/>
/// <reference lib="dom" />

import { textInput } from "./dom.ts";

/** editor上の位置情報 */
export interface Position {
  /** 行数 */ line: number;
  /** 何文字目の後ろにいるか */ char: number;
}

/** 選択範囲を表すデータ
 *
 * 選択範囲がないときは、開始と終了が同じ位置になる
 */
export interface Range {
  /** 選択範囲の開始位置 */ start: Position;
  /** 選択範囲の終了位置 */ end: Position;
}

/** #text-inputを構築しているReact Componentに含まれるカーソルの情報 */
export interface CaretInfo {
  /** カーソルの位置 */ position: Position;
  /** 選択範囲中の文字列 */ selectedText: string;
  /** 選択範囲の位置 */ selectionRange: Range;
}

interface ReactInternalInstance {
  return: {
    return: {
      stateNode: {
        props: CaretInfo;
      };
    };
  };
}

/** 現在のカーソルと選択範囲の位置情報を取得する
 *
 * @return カーソルと選択範囲の情報
 * @throws {Error} #text-inputとReact Componentの隠しpropertyが見つからなかった
 */
export function caret(): CaretInfo {
  const textarea = textInput();
  if (!textarea) {
    throw Error(`#text-input is not found.`);
  }

  const reactKey = Object.keys(textarea)
    .find((key) => key.startsWith("__reactInternalInstance"));
  if (!reactKey) {
    throw Error(
      "div.cursor must has the property whose name starts with `__reactInternalInstance`",
    );
  }

  // @ts-ignore DOMを無理矢理objectとして扱っている
  return (textarea[
    reactKey
  ] as ReactInternalInstance).return.return.stateNode.props;
}
