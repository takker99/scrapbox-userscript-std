import { Socket, socketIO } from "../../deps/socket.ts";
export type { Socket } from "../../deps/socket.ts";

/** 新しいsocketを作る */
export function makeSocket() {
  return socketIO();
}

/** websocketに(再)接続する
 *
 * @param socket 接続したいsocket
 */
export async function connect(socket: Socket): Promise<void> {
  if (socket.connected) return;
  socket.connect();

  return await new Promise<void>((resolve) =>
    socket.once("connect", () => resolve())
  );
}

/** websocketを切断する
 *
 * @param socket 切断したいsocket
 */
export async function disconnect(socket: Socket): Promise<void> {
  if (socket.disconnected) return;
  socket.disconnect();

  return await new Promise<void>((resolve) => {
    const onDisconnect = (reason: Socket.DisconnectReason) => {
      if (reason !== "io client disconnect") return;
      resolve();
      socket.off("disconnect", onDisconnect);
    };
    socket.on("disconnect", onDisconnect);
  });
}
