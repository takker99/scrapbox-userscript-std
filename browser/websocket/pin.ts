import { Socket, socketIO, wrap } from "../../deps/socket.ts";
import { connect, disconnect } from "./socket.ts";
import { getProjectId, getUserId } from "./id.ts";
import { pull } from "./pull.ts";
import { pushWithRetry } from "./_fetch.ts";

export interface PinOptions {
  /** ピン留め対象のページが存在しないときの振る舞いを変えるoption
   *
   * -`true`: タイトルのみのページを作成してピン留めする
   * - `false`: ピン留めしない
   *
   * @default false
   */
  create?: boolean;
  socket?: Socket;
}
/** 指定したページをピン留めする
 *
 * @param project ピン留めしたいページのproject
 * @param title ピン留めしたいページのタイトル
 * @param options 使用したいSocketがあれば指定する
 */
export async function pin(
  project: string,
  title: string,
  options?: PinOptions,
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
  if (head.pin > 0 || (!head.persistent && !(options?.create ?? false))) return;

  const init = {
    parentId: head.commitId,
    projectId,
    pageId: head.pageId,
    userId,
    project,
    title,
  };
  const injectedSocket = options?.socket;
  const socket = injectedSocket ?? await socketIO();
  await connect(socket);
  const { request } = wrap(socket);

  // タイトルのみのページを作る
  if (!head.persistent) {
    const commitId = await pushWithRetry(request, [{ title }], init);
    init.parentId = commitId;
  }

  try {
    await pushWithRetry(request, [{ pin: pinNumber() }], init);
  } finally {
    if (!injectedSocket) await disconnect(socket);
  }
}

export interface UnPinOptions {
  socket?: Socket;
}
/** 指定したページのピン留めを外す
 *
 * @param project ピン留めを外したいページのproject
 * @param title ピン留めを外したいページのタイトル
 */
export async function unpin(
  project: string,
  title: string,
  options: UnPinOptions,
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
  const injectedSocket = options?.socket;
  const socket = injectedSocket ?? await socketIO();
  await connect(socket);
  const { request } = wrap(socket);

  try {
    await pushWithRetry(request, [{ pin: 0 }], init);
  } finally {
    if (!injectedSocket) await disconnect(socket);
  }
}

export const pinNumber = (): number =>
  Number.MAX_SAFE_INTEGER - Math.floor(Date.now() / 1000);
