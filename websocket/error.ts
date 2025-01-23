import type { JsonValue } from "@std/json";

/** the error that occurs when scrapbox.io throws serializable {@link Error} */
export interface UnexpectedRequestError {
  name: "UnexpectedRequestError";
  error: JsonValue;
}

export interface TimeoutError {
  name: "TimeoutError";
  message: string;
}

export type PageCommitError =
  | SocketIOError
  | DuplicateTitleError
  | NotFastForwardError;

/* the error that occurs when the socket.io causes an error
*
* when this error occurs, wait for a while and retry the request
*/
export interface SocketIOError {
  name: "SocketIOError";
}

/** the error that occurs when the socket.io throws "io" server disconnect" */
export interface SocketIOServerDisconnectError {
  name: "SocketIOServerDisconnectError";
}

/** the error that occurs when the title is already in use */
export interface DuplicateTitleError {
  name: "DuplicateTitleError";
}
/** the error caused when commitId is not latest */
export interface NotFastForwardError {
  name: "NotFastForwardError";
}

export const isPageCommitError = (
  error: { name: string },
): error is PageCommitError => pageCommitErrorNames.includes(error.name);

const pageCommitErrorNames = [
  "SocketIOError",
  "DuplicateTitleError",
  "NotFastForwardError",
];
