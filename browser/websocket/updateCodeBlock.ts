import { Line } from "../../deps/scrapbox-rest.ts";
import { DeleteChange, InsertChange, UpdateChange } from "../../deps/socket.ts";
import { TinyCodeBlock } from "../../rest/getCodeBlocks.ts";
import { diffToChanges } from "./diffToChanges.ts";
import { isSimpleCodeFile } from "./isSimpleCodeFile.ts";
import { SimpleCodeFile } from "./updateCodeFile.ts";
import { countBodyIndent, extractFromCodeTitle } from "./_codeBlock.ts";
import { push, PushError, PushOptions } from "./push.ts";
import { Result } from "../../deps/option-t.ts";

export interface UpdateCodeBlockOptions extends PushOptions {
  /** `true`でデバッグ出力ON */
  debug?: boolean;
}

/** コードブロックの中身を更新する
 *
 * newCodeにSimpleCodeFileオブジェクトを渡すと、そのオブジェクトに添ってコードブロックのファイル名も書き換えます
 * （文字列や文字列配列を渡した場合は書き換えません）。
 *
 * @param newCode 更新後のコードブロック
 * @param target 更新対象のコードブロック
 * @param project 更新対象のコードブロックが存在するプロジェクト名
 */
export const updateCodeBlock = (
  newCode: string | string[] | SimpleCodeFile,
  target: TinyCodeBlock,
  options?: UpdateCodeBlockOptions,
): Promise<Result<string, PushError>> => {
  const newCodeBody = getCodeBody(newCode);
  const bodyIndent = countBodyIndent(target);
  const oldCodeWithoutIndent: Line[] = target.bodyLines.map((e) => {
    return { ...e, text: e.text.slice(bodyIndent) };
  });

  return push(
    target.pageInfo.projectName,
    target.pageInfo.pageTitle,
    (page) => {
      const diffGenerator = diffToChanges(
        oldCodeWithoutIndent,
        newCodeBody,
        page,
      );
      const commits = [...fixCommits([...diffGenerator], target)];
      if (isSimpleCodeFile(newCode)) {
        const titleCommit = makeTitleChangeCommit(newCode, target);
        if (titleCommit) commits.push(titleCommit);
      }

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

/** コード本文のテキストを取得する */
const getCodeBody = (code: string | string[] | SimpleCodeFile): string[] => {
  const content = isSimpleCodeFile(code) ? code.content : code;
  if (Array.isArray(content)) return content;
  return content.split("\n");
};

/** insertコミットの行IDとtextのインデントを修正する */
function* fixCommits(
  commits: readonly (DeleteChange | InsertChange | UpdateChange)[],
  target: TinyCodeBlock,
): Generator<DeleteChange | InsertChange | UpdateChange, void, unknown> {
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
