import { socketIO, wrap } from "../../deps/socket.ts";
import { getProjectId, getUserId } from "./id.ts";
import { makeChanges } from "./makeChanges.ts";
import { HeadData, pull } from "./pull.ts";
import { pinNumber } from "./pin.ts";
import type { Line } from "../../deps/scrapbox.ts";
import { pushCommit, pushWithRetry } from "./_fetch.ts";

/** 指定したページを削除する
 *
 * @param project 削除したいページのproject
 * @param title 削除したいページのタイトル
 */
export async function deletePage(
  project: string,
  title: string,
): Promise<void> {
  const [
    { pageId, commitId: parentId, persistent },
    projectId,
    userId,
  ] = await Promise.all([
    pull(project, title),
    getProjectId(project),
    getUserId(),
  ]);

  if (!persistent) return;

  const io = await socketIO();
  const { request } = wrap(io);

  try {
    await pushWithRetry(request, [{ deleted: true }], {
      projectId,
      pageId,
      parentId,
      userId,
      project,
      title,
    });
  } finally {
    io.disconnect();
  }
}

/** ページ全体を書き換える
 *
 * serverには書き換え前後の差分だけを送信する
 *
 * @param project 書き換えたいページのproject
 * @param title 書き換えたいページのタイトル
 * @param update 書き換え後の本文を作成する函数。引数には現在の本文が渡される。空配列を返すとページが削除される
 */
export async function patch(
  project: string,
  title: string,
  update: (lines: Line[], metadata: HeadData) => string[] | Promise<string[]>,
): Promise<void> {
  const [
    head_,
    projectId,
    userId,
  ] = await Promise.all([
    pull(project, title),
    getProjectId(project),
    getUserId(),
  ]);

  let head = head_;

  const io = await socketIO();
  try {
    const { request } = wrap(io);

    // 3回retryする
    for (let i = 0; i < 3; i++) {
      try {
        const pending = update(head.lines, head);
        const newLines = pending instanceof Promise ? await pending : pending;

        if (newLines.length === 0) {
          await pushWithRetry(request, [{ deleted: true }], {
            projectId,
            pageId: head.pageId,
            parentId: head.commitId,
            userId,
            project,
            title,
          });
        }

        const changes = makeChanges(head.lines, newLines, { userId, head });
        await pushCommit(request, changes, {
          parentId: head.commitId,
          projectId,
          pageId: head.pageId,
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
  } finally {
    io.disconnect();
  }
}

export interface PinOption {
  /** ピン留め対象のページが存在しないときの振る舞いを変えるoption
   *
   * -`true`: タイトルのみのページを作成してピン留めする
   * - `false`: ピン留めしない
   *
   * @default false
   */
  create: boolean;
}
/** 指定したページをピン留めする
 *
 * @param project ピン留めしたいページのproject
 * @param title ピン留めしたいページのタイトル
 */
export async function pin(
  project: string,
  title: string,
  option?: PinOption,
): Promise<void> {
  const [
    head,
    projectId,
    userId,
  ] = await Promise.all([
    pull(project, title),
    getProjectId(project),
    getUserId(),
  ]);

  // 既にピン留めされている場合は何もしない
  if (head.pin > 0 || (!head.persistent && !(option?.create ?? false))) return;

  const init = {
    parentId: head.commitId,
    projectId,
    pageId: head.pageId,
    userId,
    project,
    title,
  };
  const io = await socketIO();
  const { request } = wrap(io);

  // タイトルのみのページを作る
  if (!head.persistent) {
    const commitId = await pushWithRetry(request, [{ title }], init);
    init.parentId = commitId;
  }

  try {
    await pushWithRetry(request, [{ pin: pinNumber() }], init);
  } finally {
    io.disconnect();
  }
}
/** 指定したページのピン留めを外す
 *
 * @param project ピン留めを外したいページのproject
 * @param title ピン留めを外したいページのタイトル
 */
export async function unpin(
  project: string,
  title: string,
): Promise<void> {
  const [
    head,
    projectId,
    userId,
  ] = await Promise.all([
    pull(project, title),
    getProjectId(project),
    getUserId(),
  ]);

  // 既にピンが外れているか、そもそも存在しないページの場合は何もしない
  if (head.pin == 0 || !head.persistent) return;

  const init = {
    parentId: head.commitId,
    projectId,
    pageId: head.pageId,
    userId,
    project,
    title,
  };
  const io = await socketIO();
  const { request } = wrap(io);

  try {
    await pushWithRetry(request, [{ pin: 0 }], init);
  } finally {
    io.disconnect();
  }
}
