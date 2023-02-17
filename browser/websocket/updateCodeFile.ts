import type { Line } from "../../deps/scrapbox-rest.ts";
import {
  DeleteCommit,
  InsertCommit,
  Socket,
  socketIO,
  UpdateCommit,
} from "../../deps/socket.ts";
import { getCodeBlocks, TinyCodeBlock } from "../../rest/getCodeBlocks.ts";
import { pull } from "./pull.ts";
import { createNewLineId, getUserId } from "./id.ts";
import { diff, toExtendedChanges } from "../../deps/onp.ts";
import { applyCommit, countBodyIndent } from "./_codeBlock.ts";

/** コードブロックの上書きに使う情報のinterface */
export interface SimpleCodeFile {
  /** ファイル名 */
  filename: string;

  /** コードブロックの中身（文字列のみ） */
  content: string | string[];

  /** コードブロック内の強調表示に使う言語名（省略時はfilenameに含まれる拡張子を使用する） */
  lang?: string;
}

/** updateCodeFile()に使われているオプション */
export interface UpdateCodeFileOptions {
  /**
   * 指定したファイルが存在しなかった時、新しいコードブロックをページのどの位置に配置するか
   *
   * - `"notInsert"`（既定）：存在しなかった場合は何もしない
   * - `"top"`：ページ上部（タイトル行の真下）
   * - `"bottom"`：ページ下部
   */
  insertPositionIfNotExist?: "top" | "bottom" | "notInsert";

  /** `true`の場合、コードブロック作成時に空行承り太郎（ページ末尾に必ず空行を設ける機能）を有効する（既定は`true`） */
  isInsertEmptyLineInTail?: boolean;

  /** WebSocketの通信に使うsocket */
  socket?: Socket;

  /** `true`でデバッグ出力ON */
  debug?: boolean;
}

/** objectがSimpleCodeFile型かどうかを判別する */
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

/** REST API経由で取得できるようなコードファイルの中身をまるごと書き換える
 *
 * ファイルが存在していなかった場合、既定では何も書き換えない \
 *
 * 対象と同じ名前のコードブロックが同じページの複数の行にまたがっていた場合も全て書き換える \
 * その際、書き換え後のコードをそれぞれのコードブロックへ分散させるが、それっぽく分けるだけで見た目などは保証しないので注意
 *
 * @param codeFile 書き換え後のコードファイルの中身
 * @param project 書き換えたいページのプロジェクト名（Project urlの設定で使われている方）
 * @param title 書き換えたいページのタイトル
 * @param options その他の設定
 */
export const updateCodeFile = async (
  codeFile: SimpleCodeFile,
  project: string,
  title: string,
  options?: UpdateCodeFileOptions,
): Promise<void> => {
  /** optionsの既定値はこの中に入れる */
  const defaultOptions: Required<UpdateCodeFileOptions> = {
    insertPositionIfNotExist: "notInsert",
    isInsertEmptyLineInTail: true,
    socket: options?.socket ?? await socketIO(),
    debug: false,
  };
  const opt = options ? { ...defaultOptions, ...options } : defaultOptions;
  const newCode = Array.isArray(codeFile.content)
    ? codeFile.content
    : codeFile.content.split("\n");
  const head = await pull(project, title);
  const lines: Line[] = head.lines;
  const codeBlocks = await getCodeBlocks({
    project,
    title,
    lines: lines,
  }, {
    filename: codeFile.filename,
  });
  const commits = [
    ...makeCommits(codeBlocks, codeFile, lines, {
      ...opt,
      userId: await getUserId(),
    }),
  ];

  if (opt.debug) {
    console.log("vvv original code Blocks vvv");
    console.log(codeBlocks);
    console.log("vvv new codes vvv");
    console.log(newCode);
    console.log("vvv commits vvv");
    console.log(commits);
  }

  await applyCommit(commits, head, project, title, opt.socket);

  if (!options?.socket) opt.socket.disconnect();
};

/** TinyCodeBlocksの配列からコード本文をフラットな配列に格納して返す \
 * その際、コードブロックの左側に存在していたインデントは削除する
 */
function flatCodeBodies(codeBlocks: readonly TinyCodeBlock[]): Line[] {
  return codeBlocks.map((block) => {
    const indent = countBodyIndent(block);
    return block.bodyLines.map((body) => {
      return { ...body, text: body.text.slice(indent) };
    });
  }).flat();
}

/** コードブロックの差分からコミットデータを作成する */
function* makeCommits(
  _codeBlocks: readonly TinyCodeBlock[],
  codeFile: SimpleCodeFile,
  lines: Line[],
  { userId, insertPositionIfNotExist, isInsertEmptyLineInTail }: {
    userId: string;
    insertPositionIfNotExist: Required<
      UpdateCodeFileOptions["insertPositionIfNotExist"]
    >;
    isInsertEmptyLineInTail: Required<
      UpdateCodeFileOptions["isInsertEmptyLineInTail"]
    >;
  },
): Generator<DeleteCommit | InsertCommit | UpdateCommit, void, unknown> {
  function makeIndent(codeBlock: Pick<TinyCodeBlock, "titleLine">): string {
    return " ".repeat(countBodyIndent(codeBlock));
  }

  const codeBlocks: Pick<
    TinyCodeBlock,
    "titleLine" | "bodyLines" | "nextLine"
  >[] = [..._codeBlocks];
  const codeBodies = flatCodeBodies(_codeBlocks);
  if (codeBlocks.length <= 0) {
    // ページ内にコードブロックが無かった場合は新しく作成
    if (insertPositionIfNotExist === "notInsert") return;
    const nextLine = insertPositionIfNotExist === "top" && lines.length > 1
      ? lines[1]
      : null;
    const title = {
      // コードブロックのタイトル行
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
    // 空行承り太郎
    yield {
      _insert: "_end",
      lines: {
        id: createNewLineId(userId),
        text: "",
      },
    };
  }
}

function makeCodeBlockTitle(code: SimpleCodeFile) {
  const codeName = code.filename + (code.lang ? `(${code.lang})` : "");
  return `code:${codeName}`;
}
