import {
  Change,
  CommitNotification,
  socketIO,
  wrap,
} from "../../deps/socket.ts";
import { getProjectId, getUserId } from "./id.ts";
import { applyCommit } from "./applyCommit.ts";
import { toTitleLc } from "../../title.ts";
import { makeChanges } from "./makeChanges.ts";
import type { Line } from "../../deps/scrapbox.ts";
import { ensureEditablePage, pushCommit } from "./_fetch.ts";
export type { CommitNotification };

export interface JoinPageRoomResult {
  /** ページ全体を書き換える
   *
   * `update()`で現在の本文から書き換え後の本文を作ってもらう。
   * serverには書き換え前後の差分だけを送信する
   *
   * @param update 書き換え後の本文を作成する函数。引数には現在の本文が渡される
   */
  patch: (update: (before: Line[]) => string[]) => Promise<void>;
  /** ページの更新情報を購読する */
  listenPageUpdate: () => AsyncGenerator<CommitNotification, void, unknown>;
  /** ページの操作を終了する。これを呼び出すと他のmethodsは使えなくなる
   *
   * 内部的にはwebsocketを切断している
   */
  cleanup: () => void;
}
/** 指定したページを操作する
 *
 * @param project 操作したいページのproject
 * @param title 操作したいページのタイトル
 */
export async function joinPageRoom(
  project: string,
  title: string,
): Promise<JoinPageRoomResult> {
  const [
    page,
    projectId,
    userId,
  ] = await Promise.all([
    ensureEditablePage(project, title),
    getProjectId(project),
    getUserId(),
  ]);

  // 接続したページの情報
  let head = {
    persistent: page.persistent,
    lines: page.lines,
    image: page.image,
    commitId: page.commitId,
    linksLc: page.links.map((link) => toTitleLc(link)),
  };
  const pageId = page.id;

  const io = await socketIO();
  const { request, response } = wrap(io);
  await request("socket.io-request", {
    method: "room:join",
    data: { projectId, pageId, projectUpdatesStream: false },
  });

  // subscribe the latest commit
  (async () => {
    for await (const { id, changes } of response("commit")) {
      head.commitId = id;
      head.lines = applyCommit(head.lines, changes, { updated: id, userId });
    }
  })();

  return {
    patch: async (update: (before: Line[]) => string[] | Promise<string[]>) => {
      for (let i = 0; i < 3; i++) {
        try {
          const pending = update(head.lines);
          const newLines = pending instanceof Promise ? await pending : pending;
          const changes = makeChanges(head.lines, newLines, {
            userId,
            head,
          });

          const { commitId } = await pushCommit(request, changes, {
            parentId: head.commitId,
            projectId,
            pageId,
            userId,
          });

          // pushに成功したら、localにも変更を反映する
          head.commitId = commitId;
          head.persistent = true;
          head.lines = applyCommit(head.lines, changes, {
            updated: commitId,
            userId,
          });
          break;
        } catch (_e: unknown) {
          if (i === 2) {
            throw Error("Faild to retry pushing.");
          }
          console.log(
            "Faild to push a commit. Retry after pulling new commits",
          );
          try {
            const page = await ensureEditablePage(project, title);
            head = {
              persistent: page.persistent,
              lines: page.lines,
              image: page.image,
              commitId: page.commitId,
              linksLc: page.links.map((link) => toTitleLc(link)),
            };
          } catch (e: unknown) {
            throw e;
          }
        }
      }
    },
    listenPageUpdate: () => response("commit"),
    cleanup: () => {
      io.disconnect();
    },
  };
}
