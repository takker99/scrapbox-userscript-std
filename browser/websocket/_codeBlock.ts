import { Change, Socket, wrap } from "../../deps/socket.ts";
import {Page} from "../../deps/scrapbox-rest.ts";
import { TinyCodeBlock } from "../../rest/getCodeBlocks.ts";
import { getProjectId, getUserId } from "./id.ts";
import { pushWithRetry } from "./_fetch.ts";

/** コードブロックのタイトル行の情報を保持しておくためのinterface */
export interface CodeTitle {
  filename: string;
  lang: string;
  indent: number;
}

/** コミットを送信する一連の処理 */
export const applyCommit = async (
  commits: Change[],
  page: Page,
  projectName: string,
  pageTitle: string,
  socket: Socket,
  userId?: string,
): ReturnType<typeof pushWithRetry> => {
  const [projectId, userId_] = await Promise.all([
    getProjectId(projectName),
    userId ?? getUserId(),
  ]);
  const { request } = wrap(socket);
  return await pushWithRetry(request, commits, {
    parentId: page.commitId,
    projectId: projectId,
    pageId: page.id,
    userId: userId_,
    project: projectName,
    title: pageTitle,
    retry: 3,
  });
};

/** コードブロックのタイトル行から各種プロパティを抽出する
 *
 * @param lineText {string} 行テキスト
 * @return `lineText`がコードタイトル行であれば`CodeTitle`を、そうでなければ`null`を返す
 */
export const extractFromCodeTitle = (lineText: string): CodeTitle | null => {
  const matched = lineText.match(/^(\s*)code:(.+?)(\(.+\)){0,1}\s*$/);
  if (matched === null) return null;
  const filename = matched[2].trim();
  let lang = "";
  if (matched[3] === undefined) {
    const ext = filename.match(/.+\.(.*)$/);
    if (ext === null) {
      // `code:ext`
      lang = filename;
    } else if (ext[1] === "") {
      // `code:foo.`の形式はコードブロックとして成り立たないので排除する
      return null;
    } else {
      // `code:foo.ext`
      lang = ext[1].trim();
    }
  } else {
    lang = matched[3].slice(1, -1);
  }
  return {
    filename: filename,
    lang: lang,
    indent: matched[1].length,
  };
};

/** コードブロック本文のインデント数を計算する */
export function countBodyIndent(
  codeBlock: Pick<TinyCodeBlock, "titleLine">,
): number {
  return codeBlock.titleLine.text.length -
    codeBlock.titleLine.text.trimStart().length + 1;
}
