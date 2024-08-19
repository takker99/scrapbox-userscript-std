import { io, type Socket } from "socket.io-client";
import { createErr, createOk, type Result } from "option-t/plain_result";
import type { EmitEvents, ListenEvents } from "./websocket-types.ts";

/** connect to websocket
 *
 * @param socket - The socket to be connected. If not provided, a new socket will be created
 * @returns A promise that resolves to a socket if connected successfully, or an error if failed
 */
export const connect = (socket?: Socket<ListenEvents, EmitEvents>): Promise<
  Result<Socket<ListenEvents, EmitEvents>, Socket.DisconnectReason>
> => {
  if (socket?.connected) return Promise.resolve(createOk(socket));
  socket ??= io("https://scrapbox.io", {
    reconnectionDelay: 5000,
    transports: ["websocket"],
  });

  const promise = new Promise<
    Result<Socket<ListenEvents, EmitEvents>, Socket.DisconnectReason>
  >(
    (resolve) => {
      const onDisconnect = (reason: Socket.DisconnectReason) =>
        resolve(createErr(reason));
      socket.once("connect", () => {
        socket.off("disconnect", onDisconnect);
        resolve(createOk(socket));
      });
      socket.once("disconnect", onDisconnect);
    },
  );
  socket.connect();
  return promise;
};

/** Disconnect the websocket
 *
 * @param socket - The socket to be disconnected
 */
export const disconnect = (
  socket: Socket<ListenEvents, EmitEvents>,
): Promise<
  Result<
    void,
    | "io server disconnect"
    | "ping timeout"
    | "transport close"
    | "transport error"
    | "parse error"
  >
> => {
  if (socket.disconnected) return Promise.resolve(createOk(undefined));

  const promise = new Promise<
    Result<
      void,
      | "io server disconnect"
      | "ping timeout"
      | "transport close"
      | "transport error"
      | "parse error"
    >
  >(
    (resolve) => {
      const onDisconnect = (reason: Socket.DisconnectReason) => {
        if (reason !== "io client disconnect") {
          resolve(createErr(reason));
          return;
        }
        resolve(createOk(undefined));
        socket.off("disconnect", onDisconnect);
      };
      socket.on("disconnect", onDisconnect);
    },
  );
  socket.disconnect();
  return promise;
};
