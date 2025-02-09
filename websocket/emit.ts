import { createErr, createOk, type Result } from "option-t/plain_result";
import type { Socket } from "socket.io-client";
import type {
  JoinRoomRequest,
  JoinRoomResponse,
  MoveCursorData,
  PageCommit,
  PageCommitResponse,
} from "@cosense/types/websocket";
import {
  isPageCommitError,
  type PageCommitError,
  type SocketIOServerDisconnectError,
  type TimeoutError,
  type UnexpectedRequestError,
} from "./error.ts";
import type { ScrapboxSocket } from "./socket.ts";

export interface WrapperdEmitEvents {
  commit: { req: PageCommit; res: PageCommitResponse; err: PageCommitError };
  "room:join": {
    req: JoinRoomRequest;
    res: JoinRoomResponse;
    err: void;
  };
  cursor: {
    req: Omit<MoveCursorData, "socketId">;
    res: void;
    err: void;
  };
}

export interface EmitOptions {
  timeout?: number;
}

/**
 * Sends an event to the socket and returns a promise that resolves with the result.
 *
 * @template EventName - The name of the event to emit
 * @param socket - The {@linkcode ScrapboxSocket} to emit the event on
 * @param event - The name of the event to emit
 * @param data - The data to send with the event
 * @param options - Optional {@linkcode EmitOptions} for the operation
 * @returns A {@linkcode Promise}<{@linkcode Result}<T, E>> containing:
 *          - Success: The response data from the server
 *          - Error: One of several possible errors:
 *            - {@linkcode TimeoutError}: Request timed out
 *            - {@linkcode SocketIOServerDisconnectError}: Server disconnected
 *            - {@linkcode UnexpectedRequestError}: Unexpected response format
 */
export const emit = <EventName extends keyof WrapperdEmitEvents>(
  socket: ScrapboxSocket,
  event: EventName,
  data: WrapperdEmitEvents[EventName]["req"],
  options?: EmitOptions,
): Promise<
  Result<
    WrapperdEmitEvents[EventName]["res"],
    | WrapperdEmitEvents[EventName]["err"]
    | TimeoutError
    | SocketIOServerDisconnectError
    | UnexpectedRequestError
  >
> => {
  if (event === "cursor") {
    socket.emit<"cursor">(event, data as WrapperdEmitEvents["cursor"]["req"]);
    return Promise.resolve(createOk<void>(undefined));
  }

  // This event is processed using the socket.io-request protocol
  // (see: https://github.com/shokai/socket.io-request)
  // We implement a similar request-response pattern here:
  // 1. Send event with payload
  // 2. Wait for response with timeout
  // 3. Handle success/error responses
  const { resolve, promise, reject } = Promise.withResolvers<
    Result<
      WrapperdEmitEvents[EventName]["res"],
      | WrapperdEmitEvents[EventName]["err"]
      | TimeoutError
      | SocketIOServerDisconnectError
      | UnexpectedRequestError
    >
  >();

  const dispose = () => {
    socket.off("disconnect", onDisconnect);
    clearTimeout(timeoutId);
  };
  const onDisconnect = (reason: Socket.DisconnectReason) => {
    // "io client disconnect" should never occur during "commit" or "room:join" operations
    // This is an unexpected state that indicates a client-side connection issue
    if (reason === "io client disconnect") {
      dispose();
      reject(new Error("io client disconnect"));
      return;
    }
    // Unrecoverable error state
    if (reason === "io server disconnect") {
      dispose();
      resolve(createErr({ name: "SocketIOError" }));
      return;
    }
    // Ignore other reasons because socket.io will automatically reconnect
  };
  socket.on("disconnect", onDisconnect);
  const timeout = options?.timeout ?? 90000;
  const timeoutId = setTimeout(() => {
    dispose();
    resolve(
      createErr({
        name: "TimeoutError",
        message: `exceeded ${timeout} (ms)`,
      }),
    );
  }, timeout);

  const payload = event === "commit"
    ? { method: "commit" as const, data: data as PageCommit }
    : { method: "room:join" as const, data: data as JoinRoomRequest };

  socket.emit("socket.io-request", payload, (res) => {
    dispose();
    if ("error" in res) {
      resolve(
        createErr(
          isPageCommitError(res.error)
            ? res.error
            : { name: "UnexpectedRequestError", ...res },
        ),
      );
      return;
    }
    resolve(createOk(res.data));
  });

  return promise;
};
