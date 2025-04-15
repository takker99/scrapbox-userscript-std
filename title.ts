// deno-lint-ignore-file no-irregular-whitespace
/**
 * Convert a string to titleLc format
 *
 * Primarily used for comparing links for equality
 *
 * @example Converts spaces (` `) to underscores (`_`)
 * ```ts
 * import { assertEquals } from "@std/assert/equals";
 *
 * assertEquals(toTitleLc("sample text"), "sample_text");
 * assertEquals(
 *   toTitleLc("空白入り タイトル"),
 *   "空白入り_タイトル",
 * );
 * assertEquals(
 *   toTitleLc(" 前後にも 空白入り _タイトル "),
 *   "_前後にも_空白入り__タイトル_",
 * );
 * ```
 *
 * @example Converts uppercase to lowercase
 * ```ts
 * import { assertEquals } from "@std/assert/equals";
 *
 * assertEquals(toTitleLc("Scrapbox-Gyazo"), "scrapbox-gyazo");
 * assertEquals(
 *   toTitleLc("全角アルファベット「Ｓｃｒａｐｂｏｘ」も変換できる"),
 *   "全角アルファベット「ｓｃｒａｐｂｏｘ」も変換できる",
 * );
 * assertEquals(
 *   toTitleLc("Scrapbox is one of the products powered by Nota inc."),
 *   "scrapbox_is_one_of_the_products_powered_by_nota_inc.",
 * );
 * ```
 *
 * @param text - String to convert
 * @returns A {@linkcode string} containing the converted text in titleLc format
 */
export const toTitleLc = (text: string): string =>
  text.replaceAll(" ", "_").toLowerCase();

/** Convert underscores (`_`) to single-byte spaces (` `)
 *
 * ```ts
 * import { assertEquals } from "@std/assert/equals";
 *
 * assertEquals(revertTitleLc("sample_text"), "sample text");
 * assertEquals(
 *   revertTitleLc("Title_with underscore"),
 *   "Title with underscore",
 * );
 * ```
 *
 * @param text - String to convert
 * @returns A {@linkcode string} with underscores converted to spaces
 */
export const revertTitleLc = (text: string): string =>
  text.replaceAll("_", " ");

/** Encode a title into a URI-safe format
 *
 * ```ts
 * import { assertEquals } from "@std/assert/equals";
 *
 * assertEquals(encodeTitleURI("sample text"), "sample_text");
 * assertEquals(encodeTitleURI(":title:"), ":title%3A");
 * ```
 *
 * @param title - Title to encode
 * @returns A {@linkcode string} containing the URI-safe encoded title
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

/** Convert a title to a URI-safe format while minimizing percent encoding
 *
 * @example Only words
 * ```ts
 * import { assertEquals } from "@std/assert/equals";
 *
 * assertEquals(
 *   toReadableTitleURI("Normal_TitleAAA"),
 *   "Normal_TitleAAA",
 * );
 * ```
 *
 * @example With spaces
 * ```ts
 * import { assertEquals } from "@std/assert/equals";
 *
 * assertEquals(
 *   toReadableTitleURI("Title with Spaces"),
 *   "Title_with_Spaces",
 * );
 * ```
 *
 * @example With special characters
 * ```ts
 * import { assertEquals } from "@std/assert/equals";
 *
 * assertEquals(
 *   toReadableTitleURI("Title with special characters: /?{}^|<>%"),
 *  "Title_with_special_characters:_%2F%3F%7B%7D%5E%7C%3C%3E%25",
 * );
 * ```
 *
 * @example With multibyte characters
 * ```ts
 * import { assertEquals } from "@std/assert/equals";
 *
 * assertEquals(
 *   toReadableTitleURI("日本語_(絵文字✨つき)　タイトル"),
 *   "日本語_(絵文字✨つき)　タイトル",
 * );
 * ```
 *
 * @example With percent encoding
 * ```ts
 * import { assertEquals } from "@std/assert/equals";
 *
 * assertEquals(
 *   toReadableTitleURI("スラッシュ/は/percent encoding対象の/文字です"),
 *   "スラッシュ%2Fは%2Fpercent_encoding対象の%2F文字です",
 * );
 * assertEquals(
 *   toReadableTitleURI("%2Fなども/と同様percent encodingされる"),
 *   "%252Fなども%2Fと同様percent_encodingされる",
 * );
 * ```
 *
 * @param title - Title to convert
 * @returns A {@linkcode string} containing the URI-safe title with minimal percent encoding
 */
export const toReadableTitleURI = (title: string): string => {
  return title.replaceAll(" ", "_")
    .replace(/[/?#\{}^|<>%]/g, (char) => encodeURIComponent(char));
};
