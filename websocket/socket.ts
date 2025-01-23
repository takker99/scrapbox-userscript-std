import { io, type Socket } from "socket.io-client";
import { createErr, createOk, type Result } from "option-t/plain_result";
import type { ListenEvents } from "./listen-events.ts";
import type { EmitEvents } from "./emit-events.ts";
import { cookie } from "../rest/auth.ts";

/** A pre-configured {@linkcode Socket} type for Scrapbox */
export type ScrapboxSocket = Socket<ListenEvents, EmitEvents>;

/** connect to websocket
 *
 * @param socket - The {@linkcode Socket} to be connected. If not provided, a new socket will be created
 * @param sid - Scrapbox session ID (connect.sid). This is only required in Deno/Node.js environment.
 * @returns A {@linkcode Promise}<{@linkcode Socket}> that resolves to a {@linkcode Socket} if connected successfully, or an {@linkcode Error} if failed
 */
export const connect = (socket?: ScrapboxSocket, sid?: string): Promise<
  Result<ScrapboxSocket, Socket.DisconnectReason>
> => {
  if (socket?.connected) return Promise.resolve(createOk(socket));
  socket ??= io("https://scrapbox.io", {
    reconnectionDelay: 5000,
    transports: ["websocket"],
    ...(sid
      ? {
        rejectUnauthorized: false,
        extraHeaders: {
          Cookie: cookie(sid),
          Host: "scrapbox.io",
          Referer: "https://scrapbox.io/",
        },
      }
      : {}),
  });

  const promise = new Promise<
    Result<ScrapboxSocket, Socket.DisconnectReason>
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
  socket: ScrapboxSocket,
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
