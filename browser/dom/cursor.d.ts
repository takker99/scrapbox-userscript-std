import { type BaseLine, BaseStore } from "@cosense/types/userscript";
import type { Position } from "./position.ts";
import type { Page } from "./page.d.ts";

export interface SetPositionOptions {
  /** Whether to auto-scroll the page when the cursor moves outside the viewport
   *
   * @default true
   */
  scrollInView?: boolean;

  /** Source of the cursor movement event
   *
   * "mouse" indicates the cursor was moved by mouse interaction
   */
  source?: "mouse";
}

/** Class for managing cursor operations in the Scrapbox editor
 *
 * @see {@linkcode Position} for cursor position type details
 * @see {@linkcode Page} for page data type details
 */
export declare class Cursor extends BaseStore<
  { source: "mouse" | undefined } | "focusTextInput" | "scroll" | undefined
> {
  constructor();

  public startedWithTouch: boolean;

  /** Reset cursor position and remove cursor focus from the editor */
  clear(): void;

  /** Get the current cursor position */
  getPosition(): Position;

  /** Check if the cursor is currently visible */
  getVisible(): boolean;

  /** Move the cursor to the specified position */
  setPosition(
    position: Position,
    option?: SetPositionOptions,
  ): void;

  /** Show the editor's popup menu */
  showEditPopupMenu(): void;

  /** Hide the editor's popup menu */
  hidePopupMenu(): void;

  /** Focus the cursor on `#text-input` and make it visible
   *
   * This action triggers the `event: "focusTextInput"` event
   */
  focus(): void;

  /** Check if `#text-input` has focus
   *
   * Returns the same value as `this.focusTextarea`
   */
  get hasFocus(): boolean;

  /** Remove focus from `#text-input` without changing cursor visibility */
  blur(): void;

  /** Adjust cursor position to stay within valid line and column boundaries */
  fixPosition(): void;

  /** Returns `true` if the cursor is visible and at the start of a line */
  isAtLineHead(): boolean;

  /** Returns `true` if the cursor is visible and at the end of a line */
  isAtLineTail(): boolean;

  /** Make the cursor visible
   *
   * Does not change the focus state of `#text-input`
   */
  show(): void;

  /** Hide the cursor
   *
   * On touch devices, this also removes focus from `#text-input`
   */
  hide(): void;

  /** Cursor movement commands
   *
   * | Command | Description |
   * | ------ | ----------- |
   * | go-up | Move cursor up one line |
   * | go-down | Move cursor down one line |
   * | go-left | Move cursor left one character |
   * | go-right | Move cursor right one character |
   * | go-forward | Move cursor forward (similar to go-right, used in Emacs key bindings) |
   * | go-backward | Move cursor backward (similar to go-left, used in Emacs key bindings) |
   * | go-top | Jump to the beginning of the title line |
   * | go-bottom | Jump to the end of the last line |
   * | go-word-head | Move cursor to the start of the next word |
   * | go-word-tail | Move cursor to the end of the previous word |
   * | go-line-head | Jump to the start of the current line |
   * | go-line-tail | Jump to the end of the current line |
   * | go-pagedown | Move cursor down one page |
   * | go-pageup | Move cursor up one page |
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

  /** Get the content of the current page */
  get lines(): BaseLine[];

  /** Get the current page data */
  get page(): Page;

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
  /** Jump to the first character of the title */
  private goTop(): void;
  /** Jump to the end of the last line */
  private goBottom(): void;
  private goWordHead(): void;
  private getWordHead(): Position;
  private goWordTail(): void;
  private getWordTail(): Position;
  /** Jump to the position after indentation
   *
   * If cursor is already after or within indentation, jump to line start
   */
  private goLineHead(): void;
  /** Jump to the end of the current line */
  private goLineTail(): void;

  private sync(): void;
  private syncNow(): void;
  private updateTemporalHorizontalPoint(): number;
  /** Fired when the page is scrolled
   *
   * Triggers the `event: "source"` event
   */
  private emitScroll(): void;

  private data: Position;
  private temporalHorizontalPoint: number;
  private visible: boolean;
  private visiblePopupMenu: boolean;
  private focusTextarea: boolean;
}
