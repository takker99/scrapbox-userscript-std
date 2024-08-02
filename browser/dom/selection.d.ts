import { type BaseLine, BaseStore } from "../../deps/scrapbox.ts";
import type { Position } from "./position.ts";

export interface Range {
  start: Position;
  end: Position;
}

export declare class Selection extends BaseStore<undefined> {
  constructor();

  /** 現在のページ本文を取得する */
  get lines(): BaseLine[];

  /** 現在の選択範囲を取得する
   *
   * @param init 選択範囲の先頭位置がRange.startになるよう並び替えたいときは`init.normalizeOrder`を`true`にする
   * @return 現在の選択範囲
   */
  getRange(init?: { normalizeOrder: boolean }): Range;

  /** 選択範囲を変更する */
  setRange(range: Range): void;

  /** 選択を解除する */
  clear(): void;

  /** 選択範囲の先頭位置がrange.startになるよう並び替える
   *
   * @param range 並び替えたい選択範囲
   * @return 並び替えた選択範囲
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
