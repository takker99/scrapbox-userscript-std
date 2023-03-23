/// <reference no-default-lib="true"/>
/// <reference lib="esnext"/>
/// <reference lib="dom" />

import { BaseStore } from "../../deps/scrapbox.ts";
import { Position } from "./position.ts";

export interface SetPositionOptions {
  /** カーソルが画面外に移動したとき、カーソルが見える位置までページをスクロールするかどうか
   *
   * @default true
   */
  scrollInView?: boolean;

  /** カーソル移動イベントの発生箇所？
   *
   * コード内だと、"mouse"が指定されていた場合があった。詳細は不明
   */
  source?: "mouse";
}

/** カーソル操作クラス */
export declare class Cursor extends BaseStore<
  { source: "mouse" | undefined } | "focusTextInput" | "scroll" | undefined
> {
  constructor();

  /** カーソルの位置を初期化し、editorからカーソルを外す */
  clear(): void;

  /** カーソルの位置を取得する */
  getPosition(): Position;

  /** カーソルが表示されているか調べる */
  getVisible(): boolean;

  /** カーソルを指定した位置に動かす */
  setPosition(
    position: Position,
    option?: SetPositionOptions,
  ): void;

  /** popup menuを表示する */
  showEditPopupMenu(): void;

  /** popup menuを消す */
  hidePopupMenu(): void;

  /** #text-inputにカーソルをfocusし、同時にカーソルを表示する
   *
   * このとき、`event: "focusTextInput"`が発行される
   */
  focus(): void;

  /** #text-inputからfocusを外す。カーソルの表示状態は変えない */
  blur(): void;

  /** カーソルの位置が行や列の外に出ていた場合に、存在する行と列の中に納める */
  fixPosition(): void;

  /** カーソルが行頭にいてかつ表示されていたら`true` */
  isAtLineHead(): boolean;

  /** カーソルが行末にいてかつ表示されていたら`true` */
  isAtLineTail(): boolean;

  /** カーソルを表示する
   *
   * #text-inputのfocus状態は変えない
   */
  show(): void;

  /** カーソルを非表示にする
   *
   * touch deviceの場合は、#text-inputからfocusを外す
   */
  hide(): void;

  /** カーソル操作コマンド
   *
   * | Command | Description |
   * | ------ | ----------- |
   * | go-up | 1行上に動かす |
   * | go-down | 1行下に動かす |
   * | go-left | 1文字左に動かす |
   * | go-right | 1文字右に動かす |
   * | go-forward | Emacs key bindingsで使われているコマンド。go-rightとほぼ同じ |
   * | go-backward | Emacs key bindingsで使われているコマンド。go-leftとほぼ同じ |
   * | go-top | タイトル行の行頭に飛ぶ |
   * | go-bottom | 最後の行の行末に飛ぶ |
   * | go-word-head | 1単語右に動かす |
   * | go-word-tail | 1単語左に動かす |
   * | go-line-head | 行頭に飛ぶ |
   * | go-line-tail | 行末に飛ぶ |
   * | go-pagedown | 1ページ分下の行に飛ぶ |
   * | go-pageup | 1ページ分上の行に飛ぶ |
   */
  goByAction(
    action:
      | "go-up"
      | "go-down"
      | "go-left"
      | "go-right"
      | "go-forward"
      | "go-backward"
      | "go-top"
      | "go-bottom"
      | "go-word-head"
      | "go-word-tail"
      | "go-line-head"
      | "go-line-tail"
      | "go-pagedown"
      | "go-pageup",
  ): void;

  /* `scrapbox.Page.lines`とほぼ同じ */
  get lines(): unknown[];

  /* `scrapbox.Project.pages`とほぼ同じ */
  get pages(): unknown;

  private goUp(): void;
  private goPageUp(): void;
  private goDown(): void;
  private goPageDown(): void;
  private getNextLineHead(): void;
  private getPrevLineTail(): void;
  private goBackward(init?: { scrollInView: boolean }): void;
  private goForward(init?: { scrollInView: boolean }): void;
  private goLeft(): void;
  private goRight(): void;
  /** タイトルの先頭文字に飛ぶ */
  private goTop(): void;
  /** 最後の行の末尾に飛ぶ */
  private goBottom(): void;
  private goWordHead(): void;
  private getWordHead(): Position;
  private goWordTail(): void;
  private getWordTail(): Position;
  /** インデントの後ろに飛ぶ
   *
   * インデントの後ろかインデントの中にいるときは行頭に飛ぶ
   */
  private goLineHead(): void;
  /** 行末に飛ぶ */
  private goLineTail(): void;

  private sync(): void;
  private syncNow(): void;
  private updateTemporalHorizontalPoint(): number;
  /** scrollされたときに発火される
   *
   * このとき`event: "source"`が発行される
   */
  private emitScroll(): void;

  private data: Position;
  private temporalHorizontalPoint: number;
  private visible: boolean;
  private visiblePopupMenu: boolean;
  private focusTextarea: boolean;
}
