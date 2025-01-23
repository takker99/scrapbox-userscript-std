import type { BaseLine } from "@cosense/types/rest";
import type { DeleteChange, InsertChange, UpdateChange } from "./change.ts";
import { getCodeBlocks, type TinyCodeBlock } from "../rest/getCodeBlocks.ts";
import { createNewLineId } from "./id.ts";
import { diff, toExtendedChanges } from "../deps/onp.ts";
import { countBodyIndent } from "./_codeBlock.ts";
import { push, type PushError, type PushOptions } from "./push.ts";
import type { Result } from "option-t/plain_result";

/** Interface for specifying code block content and metadata for updates
 *
 * This interface is used when you want to update or create a code block in a Scrapbox page.
 * It contains all necessary information about the code block, including its filename,
 * content, and optional language specification for syntax highlighting.
 */
export interface SimpleCodeFile {
  /** The filename to be displayed in the code block's title
   * This will appear as `code:{filename}` in the Scrapbox page
   */
  filename: string;

  /** The actual content of the code block
   * Can be provided either as a single string (will be split by newlines)
   * or as an array of strings (each element represents one line)
   */
  content: string | string[];

  /** Optional language name for syntax highlighting
   * If omitted, the file extension from the filename will be used
   * Example: for "main.py", Python highlighting will be used automatically
   */
  lang?: string;
}

/** Configuration options for {@linkcode updateCodeFile} function
 *
 * These options control how code blocks are created, updated, and formatted
 * in the Scrapbox page. They extend the standard PushOptions with additional
 * settings specific to code block management.
 */
export interface UpdateCodeFileOptions extends PushOptions {
  /**
   * Specifies where to place a new code block when the target file doesn't exist
   *
   * - `"notInsert"` (default): Take no action if the file doesn't exist
   * - `"top"`: Insert at the top of the page (immediately after the title line)
   * - `"bottom"`: Insert at the bottom of the page
   *
   * This option is particularly useful when you want to ensure code blocks
   * are created in a consistent location across multiple pages.
   *
   * @default {"notInsert"}
   */
  insertPositionIfNotExist?: "top" | "bottom" | "notInsert";

  /** Controls automatic empty line insertion at the end of the page
   *
   * When `true` (default), automatically adds an empty line after the code block
   * This helps maintain consistent page formatting and improves readability by:
   * - Ensuring visual separation between content blocks
   * - Making it easier to add new content after the code block
   * - Maintaining consistent spacing across all pages
   *
   * @default {true}
   */
  isInsertEmptyLineInTail?: boolean;

  /** Enable debug output for troubleshooting
   *
   * When `true`, logs detailed information about the update process:
   * - Original code block content and structure
   * - New code being inserted or updated
   * - Generated commit operations
   *
   * Useful for understanding how the code block is being modified
   * and diagnosing any unexpected behavior.
   */
  debug?: boolean;
}

/** Update or create code blocks in a Scrapbox page via REST API
 *
 * This function provides a comprehensive way to manage code blocks in Scrapbox pages.
 * It can handle various scenarios including:
 * - Updating existing code blocks
 * - Creating new code blocks (when configured via options)
 * - Handling multiple code blocks with the same name
 * - Preserving indentation and block structure
 *
 * ## Key Features:
 * 1. Safe by default: Does nothing if the target file doesn't exist (configurable)
 * 2. Handles multiple blocks: Can update all code blocks with the same name
 * 3. Maintains structure: Preserves indentation and block formatting
 * 4. Smart distribution: When updating multiple blocks, distributes content logically
 *
 * ## Important Notes:
 * - When multiple code blocks with the same name exist, the new content will be
 *   distributed across them. While the function attempts to maintain a logical
 *   distribution, the exact visual layout is not guaranteed.
 * - The function uses diff generation to create minimal changes, helping to
 *   preserve the page's history and avoid unnecessary updates.
 *
 * @param codeFile - New content and metadata for the code file
 * @param project - Project name as used in the project URL settings
 * @param title - Title of the page to update
 * @param options - Additional configuration options (see {@linkcode UpdateCodeFileOptions})
 *
 * @example
 * ```typescript
 * await updateCodeFile(
 *   {
 *     filename: "example.ts",
 *     content: "console.log('Hello');",
 *     lang: "typescript"
 *   },
 *   "myproject",
 *   "MyPage",
 *   { insertPositionIfNotExist: "bottom" }
 * );
 * ```
 */
export const updateCodeFile = (
  codeFile: SimpleCodeFile,
  project: string,
  title: string,
  options?: UpdateCodeFileOptions,
): Promise<Result<string, PushError>> => {
  /** Set default values for options here */
  const defaultOptions: Required<
    Pick<
      UpdateCodeFileOptions,
      "insertPositionIfNotExist" | "isInsertEmptyLineInTail" | "debug"
    >
  > = {
    insertPositionIfNotExist: "notInsert",
    isInsertEmptyLineInTail: true,
    debug: false,
  };
  const opt = options ? { ...defaultOptions, ...options } : defaultOptions;

  return push(
    project,
    title,
    (page) => {
      const lines: BaseLine[] = page.lines;
      const codeBlocks = getCodeBlocks({ project, title, lines }, {
        filename: codeFile.filename,
      });
      const commits = [
        ...makeCommits(codeBlocks, codeFile, lines, {
          ...opt,
          userId: page.userId,
        }),
      ];
      if (opt.debug) {
        console.log("%cvvv original code Blocks vvv", "color: limegreen;");
        console.log(codeBlocks);
        console.log("%cvvv new codes vvv", "color: limegreen;");
        const newCode = Array.isArray(codeFile.content)
          ? codeFile.content
          : codeFile.content.split("\n");
        console.log(newCode);
        console.log("%cvvv commits vvv", "color: limegreen;");
        console.log(commits);
      }
      return commits;
    },
    options,
  );
};

/** Convert an array of {@linkcode TinyCodeBlock}s into a flat array of code lines
 *
 * This helper function processes multiple code blocks and:
 * 1. Combines all code block contents into a single array
 * 2. Removes leading indentation from each line
 * 3. Preserves line IDs and other metadata
 *
 * The resulting flat array is used for efficient diff generation
 * when comparing old and new code content. Removing indentation
 * ensures accurate content comparison regardless of the block's
 * position in the page.
 */
const flatCodeBodies = (codeBlocks: readonly TinyCodeBlock[]): BaseLine[] => {
  return codeBlocks.map((block) => {
    const indent = countBodyIndent(block);
    return block.bodyLines.map((body) => {
      return { ...body, text: body.text.slice(indent) };
    });
  }).flat();
};

/** Generate commit operations from code block differences
 *
 * This function analyzes the differences between old and new code content
 * to create a sequence of commit operations that will transform the old
 * content into the new content. It handles:
 *
 * 1. Line additions (with proper indentation)
 * 2. Line deletions
 * 3. Line modifications
 * 4. Empty line management
 *
 * The function maintains proper indentation for each code block and
 * ensures consistent formatting across the entire page.
 */
function* makeCommits(
  _codeBlocks: readonly TinyCodeBlock[],
  codeFile: SimpleCodeFile,
  lines: BaseLine[],
  { userId, insertPositionIfNotExist, isInsertEmptyLineInTail }: {
    userId: string;
    insertPositionIfNotExist: Required<
      UpdateCodeFileOptions["insertPositionIfNotExist"]
    >;
    isInsertEmptyLineInTail: Required<
      UpdateCodeFileOptions["isInsertEmptyLineInTail"]
    >;
  },
): Generator<DeleteChange | InsertChange | UpdateChange, void, unknown> {
  function makeIndent(codeBlock: Pick<TinyCodeBlock, "titleLine">): string {
    return " ".repeat(countBodyIndent(codeBlock));
  }

  const codeBlocks: Pick<
    TinyCodeBlock,
    "titleLine" | "bodyLines" | "nextLine"
  >[] = [..._codeBlocks];
  const codeBodies = flatCodeBodies(_codeBlocks);
  if (codeBlocks.length <= 0) {
    // Create a new code block if none exists in the page
    if (insertPositionIfNotExist === "notInsert") return;
    const nextLine = insertPositionIfNotExist === "top" && lines.length > 1
      ? lines[1]
      : null;
    const title = {
      // Code block title line
      _insert: nextLine?.id ?? "_end",
      lines: {
        id: createNewLineId(userId),
        text: makeCodeBlockTitle(codeFile),
      },
    };
    yield title;
    // 新しく作成したコードブロックの情報を追記
    codeBlocks.push({
      titleLine: { ...title.lines, userId, created: -1, updated: -1 },
      bodyLines: [],
      nextLine: nextLine,
    });
  }

  // 差分を求める
  const { buildSES } = diff(
    codeBodies.map((e) => e.text),
    Array.isArray(codeFile.content)
      ? codeFile.content
      : codeFile.content.split("\n"),
  );
  let lineNo = 0;
  let isInsertBottom = false;
  for (const change of toExtendedChanges(buildSES())) {
    // 差分からcommitを作成
    const { lineId, codeIndex } =
      ((): { lineId: string; codeIndex: number } => {
        if (lineNo >= codeBodies.length) {
          const index = codeBlocks.length - 1;
          return {
            lineId: codeBlocks[index].nextLine?.id ?? "_end",
            codeIndex: index,
          };
        }
        return {
          lineId: codeBodies[lineNo].id,
          codeIndex: codeBlocks.findIndex((e0) =>
            e0.bodyLines.some((e1) => e1.id == codeBodies[lineNo].id)
          ),
        };
      })();
    const codeBlock = codeBlocks[codeIndex];
    if (change.type == "added") {
      const insertCodeBlock =
        lineId == codeBlock.bodyLines[0]?.id && codeIndex >= 1
          ? codeBlocks[codeIndex - 1]
          : codeBlocks[codeIndex];
      const id = insertCodeBlock?.nextLine?.id ?? "_end";
      yield {
        _insert: id,
        lines: {
          id: createNewLineId(userId),
          text: makeIndent(insertCodeBlock) + change.value,
        },
      };
      if (id == "_end") isInsertBottom = true;
      continue;
    } else if (change.type == "deleted") {
      yield {
        _delete: lineId,
        lines: -1,
      };
    } else if (change.type == "replaced") {
      yield {
        _update: lineId,
        lines: {
          text: makeIndent(codeBlock) + change.value,
        },
      };
    }
    lineNo++;
  }
  if (isInsertBottom && isInsertEmptyLineInTail) {
    // Insert an empty line at the end for consistent page formatting
    yield {
      _insert: "_end",
      lines: {
        id: createNewLineId(userId),
        text: "",
      },
    };
  }
}

const makeCodeBlockTitle = (code: SimpleCodeFile) => {
  const codeName = code.filename + (code.lang ? `(${code.lang})` : "");
  return `code:${codeName}`;
};
