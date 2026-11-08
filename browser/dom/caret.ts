import type { Scrapbox } from "@cosense/types/userscript";
import { getCachedLines } from "./getCachedLines.ts";
declare const scrapbox: Scrapbox;

/** Position information within the editor
 *
 * @deprecated Use `CursorPosition` from `@cosense/types/userscript` instead.
 * @see {@linkcode Range} for selection range information
 */
export interface Position {
  /** Line number */ line: number;
  /** Character offset within the line */ char: number;
}

/** Represents a text selection range in the editor
 *
 * @deprecated Use `SelectionRange` from `@cosense/types/userscript` instead.
 * @see {@linkcode Position} for position type details
 */
export interface Range {
  /** Starting position of the selection */ start: Position;
  /** Ending position of the selection */ end: Position;
}

/** Cursor and selection state of the editor
 *
 * @deprecated Use `scrapbox.Page.cursor` and `scrapbox.Page.selection` instead.
 */
export interface CaretInfo {
  /** Current cursor position */ position: Position;
  /** Currently selected text */ selectedText: string;
  /** Range of the current selection */ selectionRange: Range;
}

/** Retrieves the current cursor position and text selection information
 *
 * @deprecated Use `scrapbox.Page.cursor` and `scrapbox.Page.selection` instead.
 * @returns A {@linkcode CaretInfo} containing cursor position and text selection information
 */
export const caret = (): CaretInfo => ({
  position: scrapbox.Page.cursor ?? { line: 0, char: 0 },
  selectionRange: scrapbox.Page.selection ?? {
    start: { line: 0, char: 0 },
    end: { line: 0, char: 0 },
  },
  get selectedText(): string {
    const selection = scrapbox.Page.selection;
    if (!selection) return "";
    const { start, end } = selection;
    if (start.line === end.line && start.char === end.char) return "";
    const lines = getCachedLines();
    if (!lines) return "";
    const [from, to] = start.line > end.line ||
        (start.line === end.line && start.char > end.char)
      ? [end, start]
      : [start, end];
    if (from.line === to.line) {
      return lines[from.line]?.text.slice(from.char, to.char) ?? "";
    }
    return [
      lines[from.line]?.text.slice(from.char) ?? "",
      ...lines.slice(from.line + 1, to.line).map((line) => line.text),
      lines[to.line]?.text.slice(0, to.char) ?? "",
    ].join("\n");
  },
});
