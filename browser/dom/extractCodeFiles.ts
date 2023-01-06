import { Line } from "../../deps/scrapbox.ts";

/** 一つのソースコードを表す */
export interface CodeFile {
  /** file name */
  filename: string;

  /** language */
  lang: string;

  /** splitted code */
  blocks: CodeBlock[];
}

/** 一つのコードブロックを表す */
export interface CodeBlock {
  /** 開始行のID */
  startId: string;

  /** 末尾の行のID */
  endId: string;

  /** コードブロックの最終更新日時 */
  updated: number;

  /** .code-titleのindent数 */
  indent: number;

  /** ブロック中のコード
   *
   * .code-titleは含まない
   *
   * 予めindentは削ってある
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
        // 本文ではなく、.code-titleのインデント数を登録する
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
