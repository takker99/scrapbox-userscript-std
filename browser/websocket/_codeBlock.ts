import { Change, Socket, wrap } from "../../deps/socket.ts";
import { HeadData } from "./pull.ts";
import { getProjectId, getUserId } from "./id.ts";
import { pushWithRetry } from "./_fetch.ts";
import { TinyCodeBlock } from "./getCodeBlocks.ts";

/** コミットを送信する一連の処理 */
export async function applyCommit(
  commits: Change[],
  head: HeadData,
  projectName: string,
  pageTitle: string,
  socket: Socket,
): ReturnType<typeof pushWithRetry> {
  const [projectId, userId] = await Promise.all([
    getProjectId(projectName),
    getUserId(),
  ]);
  const { request } = wrap(socket);
  return await pushWithRetry(request, commits, {
    parentId: head.commitId,
    projectId: projectId,
    pageId: head.pageId,
    userId: userId,
    project: projectName,
    title: pageTitle,
    retry: 3,
  });
}

/** コードブロック本文のインデント数を計算する */
export function countBodyIndent(
  codeBlock: Pick<TinyCodeBlock, "titleLine">,
): number {
  return codeBlock.titleLine.text.length -
    codeBlock.titleLine.text.trimStart().length + 1;
}
