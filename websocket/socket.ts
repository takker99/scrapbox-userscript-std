import { io, type Socket } from "socket.io-client";
import { createErr, createOk, type Result } from "option-t/plain_result";
import type { ListenEventMap } from "@cosense/types/websocket";
import type {
  JoinRoomRequest,
  JoinRoomResponse,
  MoveCursorData,
  PageCommit,
  PageCommitResponse,
} from "@cosense/types/websocket";

/** Emit events supported by Scrapbox's socket.io server (new protocol) */
interface ScrapboxEmitEventMap {
  commit: (
    data: PageCommit,
    callback: (
      res:
        | { data: PageCommitResponse }
        | { error: { name: string; message?: string } },
    ) => void,
  ) => void;
  "room:join": (
    data: JoinRoomRequest,
    callback: (
      res:
        | { data: JoinRoomResponse }
        | { error: { name: string; message?: string } },
    ) => void,
  ) => void;
  "page-leave": (req: { projectId: string; pageId: string }) => void;
  cursor: (req: Omit<MoveCursorData, "socketId">) => void;
}
import { cookie } from "../rest/auth.ts";

/** A pre-configured {@linkcode Socket} type for Scrapbox */
export type ScrapboxSocket = Socket<ListenEventMap, ScrapboxEmitEventMap>;

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
    auth: { protocolVersion: 2 },
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
