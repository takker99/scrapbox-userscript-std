import type { Line } from "../../deps/scrapbox-rest.ts";
import {
  Change,
  DeleteCommit,
  InsertCommit,
  Socket,
  socketIO,
  UpdateCommit,
  wrap,
} from "../../deps/socket.ts";
import { HeadData, pull } from "./pull.ts";
import { getCodeBlocks, TinyCodeBlock } from "./getCodeBlocks.ts";
import { diffToChanges } from "./diffToChanges.ts";
import { createNewLineId, getProjectId, getUserId } from "./id.ts";
import { pushCommit } from "./_fetch.ts";

/** コードブロックの上書きに使う情報のinterface */
export interface CodeFile {
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

  /** WebSocketの通信に使うsocket */
  socket?: Socket;

  /** trueでデバッグ出力ON */
  debug?: boolean;
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
 * @param options [UpdateCodeFileOptions] その他の設定
 */
export const updateCodeFile = async (
  codeFile: CodeFile,
  project: string,
  title: string,
  options?: UpdateCodeFileOptions,
): Promise<void> => {
  /** optionsの既定値はこの中に入れる */
  const defaultOptions: Required<UpdateCodeFileOptions> = {
    insertPositionIfNotExist: "notInsert",
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
    lines: lines,
  }, {
    filename: codeFile.filename,
  });
  const codeBodies = flatCodeBodies(codeBlocks);

  if (codeBlocks.length <= 0) {
    // 更新対象のコードブロックが存在していなかった場合は、新しいコードブロックを作成して終了する
    if (opt.insertPositionIfNotExist === "notInsert") return;
    const insertLineId =
      opt.insertPositionIfNotExist === "top" && lines.length >= 1
        ? lines[1].id
        : "_end";
    const commits = await makeCommitsNewCodeBlock(
      codeFile,
      insertLineId,
    );
    if (codeBodies.length <= 0) {
      await applyCommit(commits, head, project, opt.socket);
    }
    return;
  } else if (codeBodies.length <= 0) {
    // codeBodiesが無かった場合はdiffToChangesが例外を引き起こすので、その対策
    const insertLineId = codeBlocks[0].nextLine
      ? codeBlocks[0].nextLine.id
      : "_end";
    const commits = await makeCommitsNewCodeBlock(
      codeFile,
      insertLineId,
    );
    if (codeBodies.length <= 0) {
      await applyCommit(commits.splice(1), head, project, opt.socket);
    }
    return;
  }

  const changes = [...diffToChanges(
    codeBodies,
    newCode,
    { userId: await getUserId() },
  )];

  // insert行のIDと各行のインデントを修正する
  const commits = fixCommits(changes, codeBlocks);

  if (opt.debug) {
    console.log("vvv original code Blocks vvv");
    console.log(codeBlocks);
    console.log("vvv original code lines vvv");
    console.log(codeBodies);
    console.log("vvv new codes vvv");
    console.log(newCode);
    console.log("vvv commits vvv");
    console.log(commits);
  }

  // 差分を送信
  await applyCommit(commits, head, project, opt.socket);

  if (!options?.socket) opt.socket.disconnect();
};

/** TinyCodeBlocksの配列からコード本文をフラットな配列に格納して返す \
 * その際、コードブロックの左側に存在していたインデントは削除する
 */
function flatCodeBodies(codeBlocks: readonly TinyCodeBlock[]): Line[] {
  return codeBlocks.map((block) => {
    const title = block.titleLine.text;
    const indent = title.length - title.trimStart().length + 1;
    return block.bodyLines.map((body) => {
      return { ...body, text: body.text.slice(indent) };
    });
  }).flat();
}

/** コミットを送信する一連の処理 */
async function applyCommit(
  commits: Change[],
  head: HeadData,
  projectName: string,
  socket: Socket,
): ReturnType<typeof pushCommit> {
  const [projectId, userId] = await Promise.all([
    getProjectId(projectName),
    getUserId(),
  ]);

  // 3回retryする
  for (let i = 0; i < 3; i++) {
    try {
      // 差分を送信
      const { request } = wrap(socket);
      const res = await pushCommit(request, commits, {
        parentId: head.commitId,
        projectId: projectId,
        pageId: head.pageId,
        userId: userId,
      });
      return res;
    } catch (_e: unknown) {
      console.log(
        "Faild to push a commit.",
      );
      if (i === 2) break;
    }
  }
  throw Error("Faild to retry pushing.");
}

/** 新規コードブロックのコミットを作成する */
async function makeCommitsNewCodeBlock(
  code: CodeFile,
  insertLineId: string,
): Promise<InsertCommit[]> {
  const userId = await getUserId();
  const codeName = code.filename + (code.lang ? `(${code.lang})` : "");
  const codeBody = Array.isArray(code.content)
    ? code.content
    : code.content.split("\n");
  const commits: InsertCommit[] = [{
    _insert: insertLineId,
    lines: {
      id: createNewLineId(userId),
      text: `code:${codeName}`,
    },
  }];
  for (const bodyLine of codeBody) {
    commits.push({
      _insert: insertLineId,
      lines: {
        id: createNewLineId(userId),
        text: " " + bodyLine,
      },
    });
  }
  return commits;
}

/** insert行のIDと各行のインデントを修正する */
function fixCommits(
  commits: (InsertCommit | UpdateCommit | DeleteCommit)[],
  codeBlocks: TinyCodeBlock[],
) {
  const idReplacePatterns: {
    from: string;
    to: string;
    // indent: number;
  }[] = (() => {
    const patterns = [];
    for (let i = 0; i < codeBlocks.length; i++) {
      // コード本体の先頭ID -> 1つ前のコードブロックの真下の行のID
      const currentCode = codeBlocks[i];
      const nextCode = codeBlocks[i + 1];
      if (!currentCode.nextLine) continue;
      patterns.push({
        from: nextCode?.bodyLines[0].id ?? "_end",
        to: currentCode.nextLine.id,
      });
    }
    return patterns;
  })();
  for (const commit of commits) {
    if ("_delete" in commit) continue;
    else if ("_insert" in commit) {
      // ID修正
      for (const pattern of idReplacePatterns) {
        if (commit._insert !== pattern.from) continue;
        commit._insert = pattern.to;
        break;
      }
    }
    // インデント挿入
    const belongBlock = codeBlocks.find((block) => {
      const targetId = "_update" in commit ? commit._update : commit._insert;
      if (block.bodyLines.some((e) => e.id === targetId)) return true;
      if ("_update" in commit) return false;
      if (targetId === block.nextLine?.id) return true;
      return false;
    });
    console.log("vvv belong vvv");
    console.log(belongBlock);
    if (belongBlock === undefined) continue;
    const titleText = belongBlock.titleLine.text;
    const indent = titleText.length - titleText.trimStart().length + 1;
    commit.lines.text = " ".repeat(indent) + commit.lines.text;
  }
  return commits;
}
