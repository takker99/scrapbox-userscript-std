import {
  Change,
  CommitNotification,
  socketIO,
  wrap,
} from "../../deps/socket.ts";
import { getProjectId, getUserId } from "./id.ts";
import { diffToChanges } from "./patch.ts";
import { applyCommit } from "./applyCommit.ts";
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
  let parentId = page.commitId;
  let created = page.persistent;
  let lines = page.lines;
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
      parentId = id;
      lines = applyCommit(lines, changes, { updated: id, userId });
    }
  })();

  return {
    patch: async (update: (before: Line[]) => string[] | Promise<string[]>) => {
      const tryPush = async () => {
        const pending = update(lines);
        const newLines = pending instanceof Promise ? await pending : pending;
        const changes: Change[] = [
          ...diffToChanges(lines, newLines, { userId }),
        ];

        // 変更後のlinesを計算する
        const changedLines = applyCommit(lines, changes, {
          userId,
        });
        // タイトルの変更チェック
        // 空ページの場合もタイトル変更commitを入れる
        if (lines[0].text !== changedLines[0].text || !created) {
          changes.push({ title: changedLines[0].text });
        }
        // サムネイルの変更チェック
        const oldDescriptions = lines.slice(1, 6).map((line) => line.text);
        const newDescriptions = changedLines.slice(1, 6).map((lines) =>
          lines.text
        );
        if (oldDescriptions.join("\n") !== newDescriptions.join("\n")) {
          changes.push({ descriptions: newDescriptions });
        }

        // pushする
        const { commitId } = await pushCommit(request, changes, {
          parentId,
          projectId,
          pageId,
          userId,
        });

        // pushに成功したら、localにも変更を反映する
        parentId = commitId;
        created = true;
        lines = changedLines;
      };

      for (let i = 0; i < 3; i++) {
        try {
          await tryPush();
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
            parentId = page.commitId;
            created = page.persistent;
            lines = page.lines;
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
