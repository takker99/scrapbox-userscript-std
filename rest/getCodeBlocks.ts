import type { Line } from "../deps/scrapbox-rest.ts";
import { pull } from "../browser/websocket/pull.ts";
import {
  CodeTitle,
  extractFromCodeTitle,
} from "../browser/websocket/_codeBlock.ts";

/** pull()から取れる情報で構成したコードブロックの最低限の情報 */
export interface TinyCodeBlock {
  /** ファイル名 */
  filename: string;

  /** コードブロック内の強調表示に使う言語名 */
  lang: string;

  /** タイトル行 */
  titleLine: Line;

  /** コードブロックの中身（タイトル行を含まない） */
  bodyLines: Line[];

  /** コードブロックの真下の行（無ければ`null`） */
  nextLine: Line | null;

  /** コードブロックが存在するページの情報 */
  pageInfo: { projectName: string; pageTitle: string };
}

/** `getCodeBlocks()`に渡すfilter */
export interface GetCodeBlocksFilter {
  /** ファイル名 */
  filename?: string;
  /** syntax highlightに使用されている言語名 */
  lang?: string;
  /** タイトル行の行ID */
  titleLineId?: string;
}

/** 他のページ（または取得済みの行データ）のコードブロックを全て取得する
 *
 * ファイル単位ではなく、コードブロック単位で返り値を生成する \
 * そのため、同じページ内に同名のコードブロックが複数あったとしても、分けた状態で返す
 *
 * @param target 取得するページの情報（linesを渡せば内部のページ取得処理を省略する）
 * @param filter 取得するコードブロックを絞り込むfilter
 * @return コードブロックの配列
 */
export const getCodeBlocks = async (
  target: { project: string; title: string; lines?: Line[] },
  filter?: GetCodeBlocksFilter,
): Promise<TinyCodeBlock[]> => {
  const lines = await getLines(target);
  const codeBlocks: TinyCodeBlock[] = [];

  let currentCode: CodeTitle & {
    /** 読み取り中の行がコードブロックかどうか */
    isCodeBlock: boolean;
  } = {
    isCodeBlock: false,
    filename: "",
    lang: "",
    indent: 0,
  };
  for (const line of lines) {
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

/** targetを`Line[]`に変換する */
async function getLines(
  target: { project: string; title: string; lines?: Line[] },
): Promise<Line[]> {
  if (target.lines !== undefined) {
    return target.lines;
  } else {
    const head = await pull(target.project, target.title);
    return head.lines;
  }
}

/** コードブロックのフィルターに合致しているか検証する */
function isMatchFilter(
  codeBlock: TinyCodeBlock,
  filter?: GetCodeBlocksFilter,
): boolean {
  const equals = (a: unknown, b: unknown) => !a || a === b;
  return (
    equals(filter?.filename, codeBlock.filename) &&
    equals(filter?.lang, codeBlock.lang) &&
    equals(filter?.titleLineId, codeBlock.titleLine.id)
  );
}

/** 行テキストがコードブロックの一部であればそのテキストを、そうでなければnullを返す
 *
 * @param lineText {string} 行テキスト
 * @param titleIndent {number} コードブロックのタイトル行のインデントの深さ
 * @return `lineText`がコードブロックの一部であればそのテキストを、そうでなければ`null`を返す
 */
function extractFromCodeBody(
  lineText: string,
  titleIndent: number,
): string | null {
  const matched = lineText.match(/^(\s*)(.*)$/);
  if (matched === null || matched.length < 2) {
    return null;
  }
  const indent = matched[1];
  const body = matched[2];
  if (indent.length <= titleIndent) return null;
  return indent.slice(indent.length - titleIndent) + body;
}
