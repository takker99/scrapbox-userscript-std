import { Change, InsertCommit, Socket, wrap } from "../../deps/socket.ts";
import { HeadData } from "./pull.ts";
import { createNewLineId, getProjectId, getUserId } from "./id.ts";
import { CodeFile } from "./updateCodeFile.ts";
import { pushWithRetry } from "./_fetch.ts";

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

/** 新規コードブロックのコミットを作成する */
export async function makeCommitsNewCodeBlock(
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
