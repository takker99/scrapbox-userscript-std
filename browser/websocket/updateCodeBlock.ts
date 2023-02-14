import { Line } from "../../deps/scrapbox-rest.ts";
import {
  DeleteCommit,
  InsertCommit,
  Socket,
  socketIO,
  UpdateCommit,
} from "../../deps/socket.ts";
import { diffToChanges } from "./diffToChanges.ts";
import { TinyCodeBlock } from "./getCodeBlocks.ts";
import { getUserId } from "./id.ts";
import { pull } from "./pull.ts";
import { CodeFile, isCodeFile } from "./updateCodeFile.ts";
import {
  applyCommit,
  countBodyIndent,
  extractFromCodeTitle,
} from "./_codeBlock.ts";

export interface UpdateCodeBlockOptions {
  /** WebSocketの通信に使うsocket */
  socket?: Socket;

  /** `true`でデバッグ出力ON */
  debug?: boolean;
}

/** コードブロックの中身を更新する
 *
 * @param newCode 更新後のコードブロック
 * @param target 更新対象のコードブロック
 * @param project 更新対象のコードブロックが存在するプロジェクト名
 */
export const updateCodeBlock = async (
  newCode: string | string[] | CodeFile,
  target: TinyCodeBlock,
  options?: UpdateCodeBlockOptions,
) => {
  /** optionsの既定値はこの中に入れる */
  const defaultOptions: Required<UpdateCodeBlockOptions> = {
    socket: options?.socket ?? await socketIO(),
    debug: false,
  };
  const opt = options ? { ...defaultOptions, ...options } : defaultOptions;
  const { projectName, pageTitle } = target.pageInfo;
  const [
    head,
    userId,
  ] = await Promise.all([
    pull(projectName, pageTitle),
    getUserId(),
  ]);
  const newCodeBody = getCodeBody(newCode);
  const bodyIndent = countBodyIndent(target);
  const oldCodeWithoutIndent: Line[] = target.bodyLines.map((e) => {
    return { ...e, text: e.text.slice(bodyIndent) };
  });

  const diffGenerator = diffToChanges(oldCodeWithoutIndent, newCodeBody, {
    userId,
  });
  const commits = [...fixCommits([...diffGenerator], target)];
  if (isCodeFile(newCode)) {
    const titleCommit = makeTitleChangeCommit(newCode, target);
    if (titleCommit) commits.push(titleCommit);
  }

  if (opt.debug) {
    console.log("vvv original code block vvv");
    console.log(target);
    console.log("vvv new codes vvv");
    console.log(newCode);
    console.log("vvv commits vvv");
    console.log(commits);
  }

  await applyCommit(commits, head, projectName, pageTitle, opt.socket, userId);
  if (!options?.socket) opt.socket.disconnect();
};

/** コード本文のテキストを取得する */
function getCodeBody(code: string | string[] | CodeFile): string[] {
  const content = isCodeFile(code) ? code.content : code;
  if (Array.isArray(content)) return content;
  return content.split("\n");
}

/** insertコミットの行IDとtextのインデントを修正する */
function* fixCommits(
  commits: readonly (DeleteCommit | InsertCommit | UpdateCommit)[],
  target: TinyCodeBlock,
): Generator<DeleteCommit | InsertCommit | UpdateCommit, void, unknown> {
  const { nextLine } = target;
  const indent = " ".repeat(countBodyIndent(target));
  for (const commit of commits) {
    if ("_delete" in commit) {
      yield commit;
    } else if (
      "_update" in commit
    ) {
      yield {
        ...commit,
        lines: {
          ...commit.lines,
          text: indent + commit.lines.text,
        },
      };
    } else if (
      commit._insert != "_end" ||
      nextLine === null
    ) {
      yield {
        ...commit,
        lines: {
          ...commit.lines,
          text: indent + commit.lines.text,
        },
      };
    } else {
      yield {
        _insert: nextLine.id,
        lines: {
          ...commit.lines,
          text: indent + commit.lines.text,
        },
      };
    }
  }
}

/** コードタイトルが違う場合は書き換える */
function makeTitleChangeCommit(
  code: CodeFile,
  target: Pick<TinyCodeBlock, "titleLine">,
): UpdateCommit | null {
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
}
