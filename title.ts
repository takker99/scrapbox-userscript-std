/** 文字列をtitleLc形式に変換する
 *
 * - ` ` -> `_`
 *
 * - 大文字 -> 小文字
 *
 * リンクの等値比較をする際に主に使われる
 *
 * @param text 変換する文字列
 * @return 変換後の文字列
 */
export const toTitleLc = (text: string): string =>
  text.replaceAll(" ", "_").toLowerCase();

/** `_`を半角スペースに変換する
 *
 * @param text 変換する文字列
 * @return 変換後の文字列
 */
export const revertTitleLc = (text: string): string =>
  text.replaceAll("_", " ");

/** titleをURIで使える形式にEncodeする
 *
 * @param title 変換するtitle
 * @return 変換後の文字列
 */
export const encodeTitleURI = (title: string): string => {
  return [...title].map((char, index) => {
    if (char === " ") return "_";
    if (
      !noEncodeChars.includes(char) ||
      (index === title.length - 1 && noTailChars.includes(char))
    ) {
      return encodeURIComponent(char);
    }
    return char;
  }).join("");
};

const noEncodeChars = '@$&+=:;",';
const noTailChars = ':;",';

/** titleをできるだけpercent encodingせずにURIで使える形式にする
 *
 * @param title 変換するtitle
 * @return 変換後の文字列
 */
export const toReadableTitleURI = (title: string): string => {
  return title.replaceAll(" ", "_")
    .replace(/[/?#\{}^|<>%]/g, (char) => encodeURIComponent(char));
};
