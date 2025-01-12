import type { Line } from "@cosense/types/userscript";

/** Represents a single source code file with its code blocks */
export interface CodeFile {
  /** file name */
  filename: string;

  /** language */
  lang: string;

  /** splitted code */
  blocks: CodeBlock[];
}

/** Represents a single code block within a source file */
export interface CodeBlock {
  /** ID of the first line in the code block */
  startId: string;

  /** ID of the last line in the code block */
  endId: string;

  /** Last update timestamp of the code block */
  updated: number;

  /** Indentation level of the .code-title element in Scrapbox */
  indent: number;

  /** Lines of code within the block
   *
   * Excludes `.code-title`
   *
   * Indentation is already removed from each line
   */
  lines: string[];
}

/** `scrapbox.Page.lines`からcode blocksを取り出す
 *
 * @param lines ページの行
 * @return filenameをkeyにしたソースコードのMap
 */
export const extractCodeFiles = (
  lines: Iterable<Line>,
): Map<string, CodeFile> => {
  const files = new Map<string, CodeFile>();

  for (const line of lines) {
    if (!("codeBlock" in line)) continue;
    const { filename, lang, ...rest } = line.codeBlock;
    const file = files.get(filename) ?? { filename, lang, blocks: [] };
    if (rest.start || file.blocks.length === 0) {
      file.blocks.push({
        startId: line.id,
        endId: line.id,
        updated: line.updated,
        // Register the indentation level of `.code-title`, not the content
        indent: rest.indent - 1,
        lines: [],
      });
    } else {
      const block = file.blocks[file.blocks.length - 1];
      block.endId = line.id;
      block.updated = Math.max(block.updated, line.updated);
      block.lines.push([...line.text].slice(block.indent + 1).join(""));
    }

    files.set(filename, file);
  }

  return files;
};
