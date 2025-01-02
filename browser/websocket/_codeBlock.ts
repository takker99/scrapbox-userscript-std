import type { TinyCodeBlock } from "../../rest/getCodeBlocks.ts";

/** Interface for storing code block title line information
 * 
 * In Scrapbox, code blocks start with a title line that defines:
 * - The code's filename or language identifier
 * - Optional language specification in parentheses
 * - Indentation level for nested blocks
 */
export interface CodeTitle {
  filename: string;
  lang: string;
  indent: number;
}

/** Extract properties from a code block title line
 *
 * This function parses a line of text to determine if it's a valid code block title.
 * Valid formats include:
 * - `code:filename.ext` - Language determined by extension
 * - `code:filename(lang)` - Explicit language specification
 * - `code:lang` - Direct language specification without filename
 *
 * @param lineText {string} The line text to parse
 * @return {CodeTitle | null} Returns a CodeTitle object if the line is a valid code block title,
 *                           null otherwise. The CodeTitle includes the filename, language,
 *                           and indentation level.
 */
export const extractFromCodeTitle = (lineText: string): CodeTitle | null => {
  const matched = lineText.match(/^(\s*)code:(.+?)(\(.+\)){0,1}\s*$/);
  if (matched === null) return null;
  const filename = matched[2].trim();
  let lang = "";
  if (matched[3] === undefined) {
    const ext = filename.match(/.+\.(.*)$/);
    if (ext === null) {
      // `code:ext`
      lang = filename;
    } else if (ext[1] === "") {
      // Reject "code:foo." format as it's invalid (trailing dot without extension)
      // This ensures code blocks have either a valid extension or no extension at all
      return null;
    } else {
      // `code:foo.ext`
      lang = ext[1].trim();
    }
  } else {
    lang = matched[3].slice(1, -1);
  }
  return {
    filename: filename,
    lang: lang,
    indent: matched[1].length,
  };
};

/** Calculate the indentation level for code block content
 * 
 * The content of a code block is indented one level deeper than its title line.
 * This function determines the correct indentation by analyzing the title line's
 * whitespace and adding one additional level.
 */
export function countBodyIndent(
  codeBlock: Pick<TinyCodeBlock, "titleLine">,
): number {
  return codeBlock.titleLine.text.length -
    codeBlock.titleLine.text.trimStart().length + 1;
}
