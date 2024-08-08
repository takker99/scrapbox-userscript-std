import { createErr, createOk, type Result } from "option-t/plain_result";
import type { Socket } from "./socket-io.ts";
import {
  type DataOf,
  type EventMap,
  type FailedResOf,
  isPageCommitError,
  type ListenEventMap,
  type SuccessResOf,
  type TimeoutError,
  type UnexpectedError,
} from "./websocket-types.ts";
export * from "./websocket-types.ts";
export * from "./socket-io.ts";

export interface SocketOperator {
  request: <EventName extends keyof EventMap>(
    event: EventName,
    data: DataOf<EventName>,
  ) => Promise<
    Result<
      SuccessResOf<EventName>,
      FailedResOf<EventName> | UnexpectedError | TimeoutError
    >
  >;
  response: <EventName extends keyof ListenEventMap>(
    ...events: EventName[]
  ) => AsyncGenerator<ListenEventMap[EventName], void, unknown>;
}

export const wrap = (
  socket: Socket,
  timeout = 90000,
): SocketOperator => {
  const request = <EventName extends keyof EventMap>(
    event: EventName,
    data: DataOf<EventName>,
  ): Promise<
    Result<
      SuccessResOf<EventName>,
      FailedResOf<EventName> | UnexpectedError | TimeoutError
    >
  > => {
    let id: number | undefined;
    return new Promise((resolve, reject) => {
      const onDisconnect = (message: string) => {
        clearTimeout(id);
        reject(new Error(message));
      };
      socket.emit(
        event,
        data,
        (response: { data: SuccessResOf<EventName> } | { error: unknown }) => {
          clearTimeout(id);
          socket.off("disconnect", onDisconnect);
          switch (event) {
            case "socket.io-request":
              if ("error" in response) {
                if (
                  typeof response.error === "object" && response.error &&
                  "name" in response.error &&
                  typeof response.error.name === "string" &&
                  isPageCommitError({ name: response.error.name })
                ) {
                  resolve(createErr(response.error));
                } else {
                  resolve(
                    createErr(unexpectedError(response.error)),
                  );
                }
              } else if ("data" in response) {
                resolve(createOk(response.data));
              }
              break;
            case "cursor":
              if ("error" in response) {
                resolve(
                  createErr(unexpectedError(response.error)),
                );
              } else if ("data" in response) {
                resolve(createOk(response.data));
              }
              break;
          }
          reject(
            new Error(
              'Invalid response: missing "data" or "error" field',
            ),
          );
        },
      );
      id = setTimeout(() => {
        socket.off("disconnect", onDisconnect);
        resolve(
          createErr({
            name: "TimeoutError",
            message: `Timeout: exceeded ${timeout}ms`,
          }),
        );
      }, timeout);
      socket.once("disconnect", onDisconnect);
    });
  };

  async function* response<EventName extends keyof ListenEventMap>(
    ...events: EventName[]
  ) {
    type Data = ListenEventMap[EventName];
    let _resolve: ((data: Data) => void) | undefined;
    const waitForEvent = () => new Promise<Data>((res) => _resolve = res);
    const resolve = (data: Data) => {
      _resolve?.(data);
    };

    for (const event of events) {
      socket.on(
        event,
        // @ts-ignore 何故か型推論に失敗する
        resolve,
      );
    }
    try {
      while (true) {
        yield await waitForEvent();
      }
    } finally {
      for (const event of events) {
        socket.off(event, resolve);
      }
    }
  }

  return { request, response };
};

const unexpectedError = (value: unknown): UnexpectedError => ({
  name: "UnexpectedError",
  value,
});
