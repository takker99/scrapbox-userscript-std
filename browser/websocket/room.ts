import { CommitNotification, socketIO, wrap } from "../../deps/socket.ts";
import { getProjectId, getUserId } from "./id.ts";
import { applyCommit } from "./applyCommit.ts";
import { makeChanges } from "./makeChanges.ts";
import { HeadData, pull } from "./pull.ts";
import type { Line } from "../../deps/scrapbox.ts";
import { pushCommit } from "./_fetch.ts";
export type { CommitNotification };

export interface JoinPageRoomResult {
  /** ページ全体を書き換える
   *
   * `update()`で現在の本文から書き換え後の本文を作ってもらう。
   * serverには書き換え前後の差分だけを送信する
   *
   * @param update 書き換え後の本文を作成する函数。引数には現在の本文が渡される
   */
  patch: (
    update: (before: Line[], metadata?: HeadData) => string[],
  ) => Promise<void>;
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
    head_,
    projectId,
    userId,
  ] = await Promise.all([
    pull(project, title),
    getProjectId(project),
    getUserId(),
  ]);

  // 接続したページの情報
  let head = head_;

  const io = await socketIO();
  const { request, response } = wrap(io);
  await request("socket.io-request", {
    method: "room:join",
    data: { projectId, pageId: head.pageId, projectUpdatesStream: false },
  });

  // subscribe the latest commit
  (async () => {
    for await (const { id, changes } of response("commit")) {
      head.commitId = id;
      head.lines = applyCommit(head.lines, changes, { updated: id, userId });
    }
  })();

  return {
    patch: async (
      update: (
        before: Line[],
        metadata?: HeadData,
      ) => string[] | Promise<string[]>,
    ) => {
      for (let i = 0; i < 3; i++) {
        try {
          const pending = update(head.lines, head);
          const newLines = pending instanceof Promise ? await pending : pending;
          const changes = makeChanges(head.lines, newLines, {
            userId,
            head,
          });

          const { commitId } = await pushCommit(request, changes, {
            parentId: head.commitId,
            projectId,
            pageId: head.pageId,
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
            head = await pull(project, title);
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
