import type { SimpleCodeFile } from "./updateCodeFile.ts";

/** Type guard to check if an object is a SimpleCodeFile
 *
 * SimpleCodeFile represents a code block in Scrapbox with:
 * - filename: Name of the code file or block identifier
 * - content: Code content as string or array of strings
 * - lang: Optional programming language identifier
 *
 * This function performs runtime type checking to ensure:
 * 1. Input is an object (not array or primitive)
 * 2. filename is a string
 * 3. content is either:
 *    - a string (single-line code)
 *    - an array of strings (multi-line code)
 *    - an empty array (empty code block)
 * 4. lang is either undefined or a string
 */
export function isSimpleCodeFile(obj: unknown): obj is SimpleCodeFile {
  if (Array.isArray(obj) || !(obj instanceof Object)) return false;
  const code = obj as SimpleCodeFile;
  const { filename, content, lang } = code;
  return (
    typeof filename == "string" &&
    (typeof content == "string" ||
      (Array.isArray(content) &&
        (content.length == 0 || typeof content[0] == "string"))) &&
    (typeof lang == "string" || lang === undefined)
  );
}
