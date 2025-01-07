import type { BaseLine } from "@cosense/types/rest";
import type { DeleteChange, InsertChange, UpdateChange } from "./change.ts";
import type { TinyCodeBlock } from "../../rest/getCodeBlocks.ts";
import { diffToChanges } from "./diffToChanges.ts";
import { isSimpleCodeFile } from "./isSimpleCodeFile.ts";
import type { SimpleCodeFile } from "./updateCodeFile.ts";
import { countBodyIndent, extractFromCodeTitle } from "./_codeBlock.ts";
import { push, type PushError, type PushOptions } from "./push.ts";
import type { Result } from "option-t/plain_result";

/** Configuration options for code block updates
 *
 * Extends PushOptions to include debugging capabilities while
 * maintaining all WebSocket connection and retry settings.
 */
export interface UpdateCodeBlockOptions extends PushOptions {
  /** Enable debug output when true
   *
   * When enabled, logs detailed information about:
   * - Original code block state
   * - New code content
   * - Generated change commits
   */
  debug?: boolean;
}

/** Update the content of a code block in a Scrapbox page
 *
 * This function handles the complete process of updating a code block:
 * 1. Content modification with proper indentation
 * 2. Diff generation for minimal changes
 * 3. Optional filename/language updates
 * 4. WebSocket-based synchronization
 *
 * When provided with a SimpleCodeFile object, this function will also
 * update the code block's filename and language settings. String or
 * string array inputs will only modify the content while preserving
 * the existing filename and language.
 *
 * @param newCode - New content for the code block:
 *                 - string: Single-line content
 *                 - string[]: Multi-line content
 *                 - SimpleCodeFile: Content with metadata (filename, language)
 * @param target - Existing code block to update, including its current
 *                state and page information
 * @param options - Optional configuration for debugging and WebSocket
 *                 connection management
 * @returns Promise resolving to:
 *          - Success: New commit ID
 *          - Failure: Various error types (see PushError)
 */
export const updateCodeBlock = (
  newCode: string | string[] | SimpleCodeFile,
  target: TinyCodeBlock,
  options?: UpdateCodeBlockOptions,
): Promise<Result<string, PushError>> => {
  // Extract and normalize the new code content
  const newCodeBody = getCodeBody(newCode);
  // Calculate the indentation level of the existing code block
  const bodyIndent = countBodyIndent(target);
  // Remove indentation from old code for accurate diff generation
  const oldCodeWithoutIndent: BaseLine[] = target.bodyLines.map((e) => {
    return { ...e, text: e.text.slice(bodyIndent) };
  });

  return push(
    target.pageInfo.projectName,
    target.pageInfo.pageTitle,
    (page) => {
      // Generate minimal changes between old and new code
      // The diffGenerator creates a sequence of Insert/Update/Delete
      // operations that transform the old code into the new code
      const diffGenerator = diffToChanges(
        oldCodeWithoutIndent, // Original code without indentation
        newCodeBody, // New code content
        page, // Page metadata for line IDs
      );

      // Process the changes to restore proper indentation
      // and handle special cases like end-of-block insertions
      const commits = [...fixCommits([...diffGenerator], target)];

      // If we're updating from a SimpleCodeFile, check if the
      // title (filename/language) needs to be updated as well
      if (isSimpleCodeFile(newCode)) {
        const titleCommit = makeTitleChangeCommit(newCode, target);
        if (titleCommit) commits.push(titleCommit);
      }

      // Debug output to help diagnose update issues
      if (options?.debug) {
        console.log("%cvvv original code block vvv", "color: limegreen;");
        console.log(target);
        console.log("%cvvv new codes vvv", "color: limegreen;");
        console.log(newCode);
        console.log("%cvvv commits vvv", "color: limegreen;");
        console.log(commits);
      }

      return commits;
    },
    options,
  );
};

/** Extract the actual code content from various input formats
 *
 * Handles different input types uniformly by converting them into
 * an array of code lines:
 * - SimpleCodeFile: Extracts content field
 * - string[]: Uses directly
 * - string: Splits into lines
 */
const getCodeBody = (code: string | string[] | SimpleCodeFile): string[] => {
  const content = isSimpleCodeFile(code) ? code.content : code;
  if (Array.isArray(content)) return content;
  return content.split("\n");
};

/** Adjust line IDs and indentation in change commits
 *
 * This generator processes each change commit to ensure:
 * 1. Proper indentation is maintained for all code lines
 * 2. Line IDs are correctly assigned for insertions
 * 3. Special handling for end-of-block insertions
 *
 * The function preserves the original block's indentation style
 * while applying changes, ensuring consistent code formatting.
 */
function* fixCommits(
  commits: readonly (DeleteChange | InsertChange | UpdateChange)[],
  target: TinyCodeBlock,
): Generator<DeleteChange | InsertChange | UpdateChange, void, unknown> {
  // Get reference to the line after the code block for end insertions
  const { nextLine } = target;
  // Calculate the indentation string based on the block's current style
  const indent = " ".repeat(countBodyIndent(target));

  // Process each change commit to ensure proper formatting
  for (const commit of commits) {
    // Delete operations don't need indentation adjustment
    if ("_delete" in commit) {
      yield commit;
    } // Update operations need their text indented
    else if ("_update" in commit) {
      yield {
        ...commit,
        lines: {
          ...commit.lines,
          text: indent + commit.lines.text, // Add block's indentation
        },
      };
    } // Handle insert operations based on their position
    else if (
      commit._insert != "_end" || // Not an end insertion
      nextLine === null // No next line exists
    ) {
      // Regular insertion - just add indentation
      yield {
        ...commit,
        lines: {
          ...commit.lines,
          text: indent + commit.lines.text,
        },
      };
    } else {
      // End insertion - use nextLine's ID and add indentation
      yield {
        _insert: nextLine.id, // Insert before the next line
        lines: {
          ...commit.lines,
          text: indent + commit.lines.text,
        },
      };
    }
  }
}

/** Generate a commit to update the code block's title
 *
 * Creates an update commit for the title line when the filename
 * or language settings differ from the current block. The title
 * format follows the pattern:
 * - Basic: filename.ext
 * - With language: filename.ext(language)
 *
 * The function is smart enough to:
 * 1. Preserve existing title if no changes needed
 * 2. Handle files without extensions
 * 3. Only show language tag when it differs from the extension
 * 4. Maintain proper indentation in the title line
 */
const makeTitleChangeCommit = (
  code: SimpleCodeFile,
  target: Pick<TinyCodeBlock, "titleLine">,
): UpdateChange | null => {
  const lineId = target.titleLine.id;
  const targetTitle = extractFromCodeTitle(target.titleLine.text);
  if (
    targetTitle &&
    code.filename.trim() == targetTitle.filename &&
    code.lang?.trim() == targetTitle.lang
  ) return null;
  const ext = (() => {
    const matched = code.filename.match(/.+\.(.*)$/);
    if (matched === null) return code.filename;
    else if (matched[1] === "") return "";
    else return matched[1].trim();
  })();
  const title = code.filename +
    (code.lang && code.lang != ext ? `(${code.lang})` : "");
  return {
    _update: lineId,
    lines: {
      text: " ".repeat(countBodyIndent(target) - 1) + "code:" + title,
    },
  };
};
