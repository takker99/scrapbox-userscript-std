/// <reference no-default-lib="true"/>
/// <reference lib="esnext"/>
/// <reference lib="dom" />

import { BaseStore } from "../../deps/scrapbox.ts";
import { Position } from "./position.ts";

export interface Range {
  start: Position;
  end: Position;
}

export declare class Selection extends BaseStore {
  constructor();

  /** `scrapbox.Page.lines`とほぼ同じ */
  get lines(): unknown[];

  /** 現在の選択範囲を取得する */
  getRange(init?: { normalizeOrder: boolean }): Range;

  /** 選択範囲を変更する */
  setRange(range: Range): void;

  /** 選択を解除する */
  clear(): void;

  /** algorithmがよくわからない
   *
   * 何らかの条件に基づいて、startとendを入れ替えているのはわかる
   */
  normalizeOrder(range: Range): Range;

  /** 選択範囲の文字列を取得する */
  getSelectedText(): string;

  /** 選択範囲の描画上の高さを取得する */
  getSelectionsHeight(): number;

  /** 選択範囲の右上のy座標を取得する */
  getSelectionTop(): number;

  /** 全選択する */
  selectAll(): void;

  /** 与えられた選択範囲が空かどうか判定する
   *
   * defaultだと、このclassが持っている選択範囲を判定する
   */
  hasSelection(range?: Range): boolean;

  /** 与えられた範囲が1行だけ選択しているかどうか判定する
   *
   * defaultだと、このclassが持っている選択範囲を判定する
   */
  hasSingleLineSelection(range?: Range): boolean;

  /** 与えられた範囲が2行以上選択しているかどうか判定する
   *
   * defaultだと、このclassが持っている選択範囲を判定する
   */
  hasMultiLinesSelection(range?: Range): boolean;

  /** 全選択しているかどうか */
  hasSelectionAll(): boolean;

  private fixPosition(position: Position): void;
  private fixRange(): void;
  private data: Range;
}
