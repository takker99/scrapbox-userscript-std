import { isString } from "@core/unknownutil/is/string";

/** Count the number of leading whitespace characters (indentation level) */
export const getIndentCount = (text: string): number =>
  text.match(/^(\s*)/)?.[1]?.length ?? 0;

/** Count the number of subsequent lines that are indented under the specified line
 *
 * @param index Line number of the target line
 * @param lines List of lines (can be strings or objects with text property)
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
