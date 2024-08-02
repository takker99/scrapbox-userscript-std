import { isString } from "@core/unknownutil";

/** インデント数を数える */
export const getIndentCount = (text: string): number =>
  text.match(/^(\s*)/)?.[1]?.length ?? 0;

/** 指定した行の配下にある行の数を返す
 *
 * @param index 指定したい行の行番号
 * @param lines 行のリスト
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
