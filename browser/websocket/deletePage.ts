import { Socket, socketIO, wrap } from "../../deps/socket.ts";
import { connect, disconnect } from "./socket.ts";
import { getProjectId, getUserId } from "./id.ts";
import { pull } from "./pull.ts";
import { pushWithRetry } from "./_fetch.ts";

export interface DeletePageOptions {
  socket?: Socket;
}

/** 指定したページを削除する
 *
 * @param project 削除したいページのproject
 * @param title 削除したいページのタイトル
 * @param options 使用したいSocketがあれば指定する
 */
export const deletePage = async (
  project: string,
  title: string,
  options?: DeletePageOptions,
): Promise<void> => {
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

  const injectedSocket = options?.socket;
  const socket = injectedSocket ?? await socketIO();
  await connect(socket);
  const { request } = wrap(socket);
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
    if (!injectedSocket) await disconnect(socket);
  }
};
