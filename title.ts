/** Convert a string to titleLc format
 *
 * - Converts spaces (` `) to underscores (`_`)
 *
 * - Converts uppercase to lowercase
 *
 * Primarily used for comparing links for equality
 *
 * @param text String to convert
 * @return Converted string
 */
export const toTitleLc = (text: string): string =>
  text.replaceAll(" ", "_").toLowerCase();

/** Convert underscores (`_`) to single-byte spaces
 *
 * @param text String to convert
 * @return Converted string
 */
export const revertTitleLc = (text: string): string =>
  text.replaceAll("_", " ");

/** Encode a title into a URI-safe format
 *
 * @param title Title to encode
 * @return Encoded string
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
 * @param title Title to convert
 * @return URI-safe string with minimal percent encoding
 */
export const toReadableTitleURI = (title: string): string => {
  return title.replaceAll(" ", "_")
    .replace(/[/?#\{}^|<>%]/g, (char) => encodeURIComponent(char));
};
