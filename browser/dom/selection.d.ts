import { type BaseLine, BaseStore } from "@cosense/types/userscript";
import type { Position } from "./position.ts";

export interface Range {
  start: Position;
  end: Position;
}

export declare class Selection extends BaseStore<undefined> {
  constructor();

  /**
   * A class that manages text selection in Scrapbox pages.
   * It handles selection ranges, provides utilities for text manipulation,
   * and maintains the selection state across user interactions.
   */

  /** Get the current page content as an array of lines */
  get lines(): BaseLine[];

  /** Get the current selection range
   *
   * @param init Set `init.normalizeOrder` to `true` to ensure Range.start is
   *            the beginning of the selection (useful for consistent text processing)
   * @returns The current {@linkcode Range} object representing the selection
   */
  getRange(init?: { normalizeOrder: boolean }): Range;

  /** Update the current selection range */
  setRange(range: Range): void;

  /** Clear the current selection */
  clear(): void;

  /** Normalize the selection range order to ensure start position comes before end
   *
   * @param range - The selection range to normalize
   * @returns A normalized {@linkcode Range} with start position at the beginning
   *
   * This is useful when you need consistent text processing regardless of
   * whether the user selected text from top-to-bottom or bottom-to-top.
   */
  normalizeOrder(range: Range): Range;

  /** Get the text content of the current selection */
  getSelectedText(): string;

  /** Get the visual height of the selection in pixels */
  getSelectionsHeight(): number;

  /** Get the Y-coordinate of the selection's top-right corner */
  getSelectionTop(): number;

  /** Select all content in the current page */
  selectAll(): void;

  /** Check if there is any active selection
   *
   * @param range Optional range to check. If not provided,
   *              checks this class's current selection
   */
  hasSelection(range?: Range): boolean;

  /** Check if exactly one line is selected
   *
   * @param range Optional range to check. If not provided,
   *              checks this class's current selection
   */
  hasSingleLineSelection(range?: Range): boolean;

  /** Check if multiple lines are selected (2 or more)
   *
   * @param range Optional range to check. If not provided,
   *              checks this class's current selection
   */
  hasMultiLinesSelection(range?: Range): boolean;

  /** Check if all content in the current page is selected
   *
   * This is equivalent to checking if the selection spans
   * from the beginning of the first line to the end of the last line
   */
  hasSelectionAll(): boolean;

  private fixPosition(position: Position): void;
  private fixRange(): void;
  private data: Range;
}
