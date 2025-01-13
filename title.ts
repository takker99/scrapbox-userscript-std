/** Convert a string to titleLc format
 *
 * - Converts spaces (` `) to underscores (`_`)
 * - Converts uppercase to lowercase
 *
 * Primarily used for comparing links for equality
 *
 * @param text - String to convert
 * @returns A {@linkcode string} containing the converted text in titleLc format
 */
export const toTitleLc = (text: string): string =>
  text.replaceAll(" ", "_").toLowerCase();

/** Convert underscores (`_`) to single-byte spaces
 *
 * @param text - String to convert
 * @returns A {@linkcode string} with underscores converted to spaces
 */
export const revertTitleLc = (text: string): string =>
  text.replaceAll("_", " ");

/** Encode a title into a URI-safe format
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
 * @param title - Title to convert
 * @returns A {@linkcode string} containing the URI-safe title with minimal percent encoding
 */
export const toReadableTitleURI = (title: string): string => {
  return title.replaceAll(" ", "_")
    .replace(/[/?#\{}^|<>%]/g, (char) => encodeURIComponent(char));
};
