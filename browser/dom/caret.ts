import { textInput } from "./dom.ts";

/** Position information within the editor
 * 
 * @see {@linkcode Range} for selection range information
 */
export interface Position {
  /** Line number (1-based) */ line: number;
  /** Character offset within the line (0-based) */ char: number;
}

/** Represents a text selection range in the editor
 *
 * When no text is selected, {@linkcode start} and {@linkcode end} positions are the same (cursor position)
 * 
 * @see {@linkcode Position} for position type details
 */
export interface Range {
  /** Starting position of the selection */ start: Position;
  /** Ending position of the selection */ end: Position;
}

/** Cursor information contained within the React Component that builds `#text-input` */
export interface CaretInfo {
  /** Current cursor position */ position: Position;
  /** Currently selected text */ selectedText: string;
  /** Range of the current selection */ selectionRange: Range;
}

interface ReactFiber {
  return: {
    return: {
      stateNode: {
        props: CaretInfo;
      };
    };
  };
}

/** Retrieves the current cursor position and text selection information
 *
 * @return Information about cursor position and text selection
 * @throws {Error} When `#text-input` element or React Component's internal properties are not found
 * @see {@linkcode CaretInfo} for return type details
 */
export const caret = (): CaretInfo => {
  const textarea = textInput();
  if (!textarea) {
    throw Error(`#text-input is not found.`);
  }

  const reactKey = Object.keys(textarea)
    .find((key) => key.startsWith("__reactFiber"));
  if (!reactKey) {
    throw Error(
      'div.cursor must has the property whose name starts with "__reactFiber"',
    );
  }

  // @ts-ignore Forcefully treating DOM element as an object to access React internals
  return (textarea[
    reactKey
  ] as ReactFiber).return.return.stateNode.props;
};
