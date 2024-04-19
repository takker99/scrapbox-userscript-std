import { Socket, socketIO, wrap } from "../../deps/socket.ts";
import { connect, disconnect } from "./socket.ts";
import { getProjectId, getUserId } from "./id.ts";
import { makeChanges } from "./makeChanges.ts";
import { pull } from "./pull.ts";
import { Line, Page } from "../../deps/scrapbox-rest.ts";
import { pushCommit, pushWithRetry } from "./_fetch.ts";

export interface PatchOptions {
  socket?: Socket;
}

export interface PatchMetadata extends Page {
  /** 書き換えを再試行した回数
   *
   * 初回は`0`で、再試行するたびに増える
   */
  retry: number;
}

/** ページ全体を書き換える
 *
 * serverには書き換え前後の差分だけを送信する
 *
 * @param project 書き換えたいページのproject
 * @param title 書き換えたいページのタイトル
 * @param update 書き換え後の本文を作成する函数。引数には現在の本文が渡される。空配列を返すとページが削除される。undefinedを返すと書き換えを中断する
 * @param options 使用したいSocketがあれば指定する
 */
export const patch = async (
  project: string,
  title: string,
  update: (
    lines: Line[],
    metadata: PatchMetadata,
  ) => string[] | undefined | Promise<string[] | undefined>,
  options?: PatchOptions,
): Promise<void> => {
  const [
    page_,
    projectId,
    userId,
  ] = await Promise.all([
    pull(project, title),
    getProjectId(project),
    getUserId(),
  ]);

  let page = page_;

  const injectedSocket = options?.socket;
  const socket = injectedSocket ?? await socketIO();
  await connect(socket);
  try {
    const { request } = wrap(socket);

    // 3回retryする
    for (let retry = 0; retry < 3; retry++) {
      try {
        const pending = update(page.lines, { ...page, retry });
        const newLines = pending instanceof Promise ? await pending : pending;

        if (!newLines) return;

        if (newLines.length === 0) {
          await pushWithRetry(request, [{ deleted: true }], {
            projectId,
            pageId: page.id,
            parentId: page.commitId,
            userId,
            project,
            title,
          });
        }

        const changes = [
          ...makeChanges(page.lines, newLines, { userId, page }),
        ];
        await pushCommit(request, changes, {
          parentId: page.commitId,
          projectId,
          pageId: page.id,
          userId,
        });
        break;
      } catch (_e: unknown) {
        if (retry === 2) {
          throw Error("Faild to retry pushing.");
        }
        console.log(
          "Faild to push a commit. Retry after pulling new commits",
        );
        try {
          page = await pull(project, title);
        } catch (e: unknown) {
          throw e;
        }
      }
    }
  } finally {
    if (!injectedSocket) await disconnect(socket);
  }
};
