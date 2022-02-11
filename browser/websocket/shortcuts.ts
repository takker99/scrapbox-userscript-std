import { socketIO, wrap } from "../../deps/socket.ts";
import { getProjectId, getUserId } from "./id.ts";
import { makeChanges } from "./makeChanges.ts";
import { pinNumber } from "./pin.ts";
import type { Line } from "../../deps/scrapbox.ts";
import { toTitleLc } from "../../title.ts";
import { ensureEditablePage, pushCommit, pushWithRetry } from "./_fetch.ts";

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
    { id: pageId, commitId: initialCommitId, persistent },
    projectId,
    userId,
  ] = await Promise.all([
    ensureEditablePage(project, title),
    getProjectId(project),
    getUserId(),
  ]);
  let parentId = initialCommitId;

  if (!persistent) return;

  const io = await socketIO();
  const { request } = wrap(io);

  try {
    parentId = await pushWithRetry(request, [{ deleted: true }], {
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
 * @param update 書き換え後の本文を作成する函数。引数には現在の本文が渡される
 */
export async function patch(
  project: string,
  title: string,
  update: (lines: Line[]) => string[] | Promise<string[]>,
): Promise<void> {
  const [
    page,
    projectId,
    userId,
  ] = await Promise.all([
    ensureEditablePage(project, title),
    getProjectId(project),
    getUserId(),
  ]);

  let head = {
    persistent: page.persistent,
    lines: page.lines,
    image: page.image,
    commitId: page.commitId,
    linksLc: page.links.map((link) => toTitleLc(link)),
  };
  const pageId = page.id;

  const io = await socketIO();
  try {
    const { request } = wrap(io);

    // 3回retryする
    for (let i = 0; i < 3; i++) {
      try {
        const pending = update(head.lines);
        const newLines = pending instanceof Promise ? await pending : pending;
        const changes = makeChanges(head.lines, newLines, { userId, head });

        await pushCommit(request, changes, {
          parentId: head.commitId,
          projectId,
          pageId,
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
    { id: pageId, commitId: initialCommitId, persistent, pin },
    projectId,
    userId,
  ] = await Promise.all([
    ensureEditablePage(project, title),
    getProjectId(project),
    getUserId(),
  ]);
  let parentId = initialCommitId;

  // 既にピン留めされている場合は何もしない
  if (pin > 0 || (!persistent && !(option?.create ?? false))) return;

  const init = { projectId, pageId, userId, project, title };
  const io = await socketIO();
  const { request } = wrap(io);

  // タイトルのみのページを作る
  if (!persistent) {
    parentId = await pushWithRetry(request, [{ title }], {
      parentId,
      ...init,
    });
  }

  try {
    parentId = await pushWithRetry(request, [{ pin: pinNumber() }], {
      parentId,
      ...init,
    });
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
    { id: pageId, commitId: initialCommitId, persistent, pin },
    projectId,
    userId,
  ] = await Promise.all([
    ensureEditablePage(project, title),
    getProjectId(project),
    getUserId(),
  ]);
  let parentId = initialCommitId;

  // 既にピンが外れているか、そもそも存在しないページの場合は何もしない
  if (pin == 0 || !persistent) return;

  const init = { projectId, pageId, userId, project, title };
  const io = await socketIO();
  const { request } = wrap(io);

  try {
    parentId = await pushWithRetry(request, [{ pin: 0 }], {
      parentId,
      ...init,
    });
  } finally {
    io.disconnect();
  }
}
