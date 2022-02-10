import {
  Change,
  CommitNotification,
  socketIO,
  wrap,
} from "../../deps/socket.ts";
import { createNewLineId, getProjectId, getUserId } from "./id.ts";
import { diffToChanges } from "./patch.ts";
import { applyCommit } from "./applyCommit.ts";
import type { Line } from "../../deps/scrapbox.ts";
import { ensureEditablePage, pushCommit, pushWithRetry } from "./_fetch.ts";
export type { CommitNotification };

export interface JoinPageRoomResult {
  /** 特定の位置にテキストを挿入する
   *
   * @param text - 挿入したいテキスト (複数行も可)
   * @param beforeId - この行IDが指し示す行の上に挿入する。末尾に挿入する場合は`_end`を指定する
   */
  insert: (text: string, beforeId: string) => Promise<void>;
  /** 特定の行を削除する
   *
   * @param lineId 削除したい行の行ID
   */
  remove: (lineId: string) => Promise<void>;
  /** 特定の位置のテキストを書き換える
   *
   * @param text - 書き換え後のテキスト (改行は不可)
   * @param lineId - 書き換えたい行の行ID
   */
  update: (text: string, lineId: string) => Promise<void>;

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

  async function push(changes: Change[], retry = 3) {
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
    const newDescriptions = changedLines.slice(1, 6).map((lines) => lines.text);
    if (oldDescriptions.join("\n") !== newDescriptions.join("\n")) {
      changes.push({ descriptions: newDescriptions });
    }

    // serverにpushする
    parentId = await pushWithRetry(request, changes, {
      parentId,
      projectId,
      pageId,
      userId,
      project,
      title,
      retry,
    });
    // pushに成功したら、localにも変更を反映する
    created = true;
    lines = changedLines;
  }

  return {
    insert: async (text: string, beforeId = "_end") => {
      const changes = text.split(/\n|\r\n/).map((line) => ({
        _insert: beforeId,
        lines: { text: line, id: createNewLineId(userId) },
      }));
      await push(changes);
    },
    remove: (lineId: string) => push([{ _delete: lineId, lines: -1 }]),
    update: (text: string, lineId: string) =>
      push([{ _update: lineId, lines: { text } }]),
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
