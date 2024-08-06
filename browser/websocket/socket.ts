import { type Socket, socketIO } from "./socket-io.ts";
export type { Socket } from "./socket-io.ts";

/** 新しいsocketを作る */
export const makeSocket = (): Promise<Socket> => socketIO();

/** websocketに(再)接続する
 *
 * @param socket 接続したいsocket
 */
export const connect = async (socket: Socket): Promise<void> => {
  if (socket.connected) return;

  const waiting = new Promise<void>((resolve) =>
    socket.once("connect", () => resolve())
  );
  socket.connect();
  await waiting;
};

/** websocketを切断する
 *
 * @param socket 切断したいsocket
 */
export const disconnect = async (socket: Socket): Promise<void> => {
  if (socket.disconnected) return;

  const waiting = new Promise<void>((resolve) => {
    const onDisconnect = (reason: Socket.DisconnectReason) => {
      if (reason !== "io client disconnect") return;
      resolve();
      socket.off("disconnect", onDisconnect);
    };
    socket.on("disconnect", onDisconnect);
  });
  socket.disconnect();
  await waiting;
};
