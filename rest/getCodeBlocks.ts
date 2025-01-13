import type { BaseLine } from "@cosense/types/rest";
import {
  type CodeTitle,
  extractFromCodeTitle,
} from "../browser/websocket/_codeBlock.ts";

/** Minimal information about a code block that can be extracted from pull() response
 *
 * This interface represents the essential structure of a code block in Scrapbox,
 * containing only the information that can be reliably extracted from the page content.
 */
export interface TinyCodeBlock {
  /** The filename specified in the code block title.
   * For named code blocks, this is the actual filename (e.g., "example.js").
   * For anonymous code blocks, this is derived from the language hint (e.g., "py" becomes "code.py").
   */
  filename: string;

  /** The programming language used for syntax highlighting.
   * This is either explicitly specified in the code block title or
   * inferred from the filename extension.
   */
  lang: string;

  /** The title line of the code block.
   * This is the line containing the "code:" directive.
   */
  titleLine: BaseLine;

  /** The content lines of the code block.
   * These are all the indented lines following the title line,
   * excluding the title line itself.
   */
  bodyLines: BaseLine[];

  /** The first non-code-block line after this code block.
   * This is the first line that either:
   * - Has less indentation than the code block
   * - Is empty
   * - Is null if this is the last line in the page
   */
  nextLine: BaseLine | null;

  /** Information about the page containing this code block */
  pageInfo: { projectName: string; pageTitle: string };
}

/** Filter options for getCodeBlocks()
 *
 * This interface allows you to filter code blocks by various criteria.
 * All filters are optional and can be combined. When multiple filters
 * are specified, they are combined with AND logic (all must match).
 */
export interface GetCodeBlocksFilter {
  /** Filter by filename
   * Only returns code blocks with exactly matching filename
   */
  filename?: string;

  /** Filter by programming language
   * Only returns code blocks using this language for syntax highlighting
   */
  lang?: string;

  /** Filter by the ID of the title line
   * Useful for finding a specific code block when you know its location
   */
  titleLineId?: string;
}

/** Extract all code blocks from a Scrapbox page
 *
 * This function processes the page content and identifies all code blocks,
 * returning them as separate entities even if they share the same filename.
 * Each code block is treated independently, allowing for multiple code blocks
 * with the same name to exist in the same page.
 *
 * @example
 * ```typescript
 * import type { BaseLine } from "@cosense/types/rest";
 * import { getPage } from "@cosense/std/rest";
 * import { isErr, unwrapErr, unwrapOk } from "option-t/plain_result";
 *
 * const result = await getPage("my-project", "My Page");
 * if(isErr(result)) {
 *   throw new Error(`Failed to get page: ${unwrapErr(result)}`);
 * }
 * const page = unwrapOk(result);
 *
 * const codeBlocks = getCodeBlocks({
 *   project: "my-project",
 *   title: page.title,
 *   lines: page.lines,
 * }, {
 *   lang: "typescript" // optional: filter by language
 * });
 * ```
 *
 * @param target Information about the page to process, including its content lines
 * @param filter Optional criteria to filter the returned code blocks
 * @returns Array of {@linkcode CodeBlock} objects matching the filter criteria
 */
export const getCodeBlocks = (
  target: { project: string; title: string; lines: BaseLine[] },
  filter?: GetCodeBlocksFilter,
): TinyCodeBlock[] => {
  const codeBlocks: TinyCodeBlock[] = [];

  let currentCode: CodeTitle & {
    /** Whether the current line is part of a code block */
    isCodeBlock: boolean;
  } = {
    isCodeBlock: false,
    filename: "",
    lang: "",
    indent: 0,
  };
  for (const line of target.lines) {
    if (currentCode.isCodeBlock) {
      const body = extractFromCodeBody(line.text, currentCode.indent);
      if (body === null) {
        codeBlocks[codeBlocks.length - 1].nextLine = line;
        currentCode.isCodeBlock = false;
        continue;
      }
      codeBlocks[codeBlocks.length - 1].bodyLines.push(line);
    } else {
      const matched = extractFromCodeTitle(line.text);
      if (matched === null) {
        currentCode.isCodeBlock = false;
        continue;
      }
      currentCode = { isCodeBlock: true, ...matched };
      codeBlocks.push({
        filename: currentCode.filename,
        lang: currentCode.lang,
        titleLine: line,
        bodyLines: [],
        nextLine: null,
        pageInfo: {
          projectName: target.project,
          pageTitle: target.title,
        },
      });
    }
  }
  return codeBlocks.filter((codeBlock) => isMatchFilter(codeBlock, filter));
};

/** Verify if a code block matches the specified filter criteria */
const isMatchFilter = (
  codeBlock: TinyCodeBlock,
  filter?: GetCodeBlocksFilter,
): boolean =>
  equals(filter?.filename, codeBlock.filename) &&
  equals(filter?.lang, codeBlock.lang) &&
  equals(filter?.titleLineId, codeBlock.titleLine.id);

const equals = (a: unknown, b: unknown): boolean => !a || a === b;

/** Process a line of text to determine if it's part of a code block
 *
 * This function checks if a given line belongs to the current code block
 * by comparing its indentation level with the code block's title indentation.
 * A line is considered part of the code block if it has more indentation
 * than the title line.
 *
 * @param lineText The text content of the line to process
 * @param titleIndent The indentation level (number of spaces) of the code block's title line
 * @returns The processed {@linkcode string} if it's part of the code block, `null` otherwise
 */
const extractFromCodeBody = (
  lineText: string,
  titleIndent: number,
): string | null => {
  const matched = lineText.replaceAll("\r", "").match(/^(\s*)(.*)$/);
  if (matched === null || matched.length < 2) {
    return null;
  }
  const indent = matched[1];
  const body = matched[2];
  if (indent.length <= titleIndent) return null;
  return indent.slice(indent.length - titleIndent) + body;
};
