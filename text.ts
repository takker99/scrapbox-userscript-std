// deno-lint-ignore-file no-irregular-whitespace
import { isString } from "@core/unknownutil/is/string";

/** Count the number of leading whitespace characters (indentation level)
 *
 * ```ts
 * import { assertEquals } from "@std/assert/equals";
 *
 * assertEquals(getIndentCount("sample text "), 0);
 * assertEquals(getIndentCount("  sample text "), 2);
 * assertEquals(getIndentCount("　　 sample text"), 3);
 * assertEquals(getIndentCount("\t \t　　sample text"), 5);
 * ```
 *
 * @param text - The input {@linkcode string} to analyze
 * @returns The {@linkcode number} of leading whitespace characters
 */
export const getIndentCount = (text: string): number =>
  text.match(/^(\s*)/)?.[1]?.length ?? 0;

/** Count the number of subsequent lines that are indented under the specified line
 *
 * @param index - Line number of the target line
 * @param lines - List of lines (can be strings or objects with text property)
 */
export const getIndentLineCount = (
  index: number,
  lines: readonly string[] | readonly { text: string }[],
): number => {
  const base = getIndentCount(getText(index, lines));
  let count = 0;
  while (
    index + count + 1 < lines.length &&
    (getIndentCount(getText(index + count + 1, lines))) > base
  ) {
    count++;
  }
  return count;
};

const getText = (
  index: number,
  lines: readonly string[] | readonly { text: string }[],
) => {
  const line = lines[index];
  return isString(line) ? line : line.text;
};
