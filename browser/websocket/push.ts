import type { Change, DeletePageChange, PinChange } from "./change.ts";
import type { PageCommit } from "./emit-events.ts";
import { connect, disconnect } from "./socket.ts";
import type { Socket } from "socket.io-client";
import { emit } from "./emit.ts";
import { pull } from "./pull.ts";
import type {
  ErrorLike,
  NotFoundError,
  NotLoggedInError,
  NotMemberError,
  Page,
} from "@cosense/types/rest";
import { delay } from "@std/async/delay";
import {
  createErr,
  createOk,
  isErr,
  isOk,
  type Result,
  unwrapErr,
  unwrapOk,
} from "option-t/plain_result";
import type { HTTPError } from "../../rest/responseIntoResult.ts";
import type { AbortError, NetworkError } from "../../rest/robustFetch.ts";
import type { TooLongURIError } from "../../rest/pages.ts";
import type {
  SocketIOServerDisconnectError,
  UnexpectedRequestError,
} from "./error.ts";

/** Configuration options for the push operation */
export interface PushOptions {
  /** Optional Socket instance for external WebSocket connection control
   *
   * This allows providing an existing Socket instance instead of creating
   * a new one. Useful for reusing connections or custom Socket configurations.
   */
  socket?: Socket;

  /** Maximum number of push retry attempts
   *
   * When this limit is exceeded, the operation fails with a `RetryError`.
   * Each retry occurs when there's a conflict (NotFastForwardError) or
   * duplicate title issue, allowing the client to resolve the conflict
   * by fetching the latest page state and recreating the changes.
   */
  maxAttempts?: number;
}

/** Error returned when push retry attempts are exhausted
 *
 * This error indicates that the maximum number of retry attempts was
 * reached without successfully applying the changes, usually due to
 * concurrent modifications or persistent conflicts.
 */
export interface RetryError {
  name: "RetryError";
  message: string;
  /** Number of attempts made before giving up */
  attempts: number;
}

/** Extended page metadata required for WebSocket operations
 *
 * This interface extends the basic Page type with additional identifiers
 * needed for real-time collaboration and page modifications.
 */
export interface PushMetadata extends Page {
  /** Unique identifier of the project containing the page */
  projectId: string;
  /** Unique identifier of the current user */
  userId: string;
}

/** Error for unexpected conditions during push operations
 *
 * This error type is used when the push operation encounters an
 * unexpected state or receives an invalid response.
 */
export interface UnexpectedError extends ErrorLike {
  name: "UnexpectedError";
}

/** Comprehensive error type for push operations
 *
 * This union type includes all possible errors that may occur during
 * a push operation, including:
 * - Operation errors (Retry, Unexpected)
 * - WebSocket errors (SocketIOServerDisconnect, UnexpectedRequest)
 * - Authentication errors (NotLoggedIn)
 * - Authorization errors (NotMember)
 * - Resource errors (NotFound, TooLongURI)
 * - Network errors (Network, Abort, HTTP)
 */
export type PushError =
  | RetryError
  | SocketIOServerDisconnectError
  | UnexpectedRequestError
  | NotFoundError
  | NotLoggedInError
  | Omit<NotLoggedInError, "details">
  | NotMemberError
  | TooLongURIError
  | HTTPError
  | NetworkError
  | AbortError;

/** Function type for creating commits to be pushed
 *
 * This handler is called by {@linkcode push} to generate the changes
 * that should be applied to the page. It may be called multiple times
 * if conflicts occur, allowing the changes to be recreated based on
 * the latest page state.
 *
 * @param page - Current page metadata including latest commit ID
 * @param attempts - Current attempt number (starts from 1)
 * @param prev - Changes from the previous attempt (empty on first try)
 * @param reason - If retrying, explains why the previous attempt failed:
 *                - NotFastForwardError: Concurrent modification detected
 *                - DuplicateTitleError: Page title already exists
 * @returns Array of changes to apply, or empty array to cancel the push
 */
export type CommitMakeHandler = (
  page: PushMetadata,
  attempts: number,
  prev: Change[] | [DeletePageChange] | [PinChange],
  reason?: "NotFastForwardError" | "DuplicateTitleError",
) =>
  | Promise<Change[] | [DeletePageChange] | [PinChange]>
  | Change[]
  | [DeletePageChange]
  | [PinChange];

/** Push changes to a specific page using WebSocket
 *
 * This function implements a robust page modification mechanism with:
 * - Automatic conflict resolution through retries
 * - Concurrent modification detection
 * - WebSocket connection management
 * - Error recovery strategies
 *
 * The function will retry the push operation if server-side conflicts
 * occur, allowing the client to fetch the latest page state and
 * recreate the changes accordingly.
 *
 * @param project - Name of the project containing the page
 * @param title - Title of the page to modify
 * @param makeCommit - Function that generates the changes to apply.
 *                    Return empty array to cancel the operation.
 * @param options - Optional configuration for push behavior
 * @returns On success/cancel: new commit ID
 *          On max retries: RetryError
 *          On other errors: Various error types (see PushError)
 */
export const push = async (
  project: string,
  title: string,
  makeCommit: CommitMakeHandler,
  options?: PushOptions,
): Promise<Result<string, PushError>> => {
  const result = await connect(options?.socket);
  if (isErr(result)) {
    return createErr({
      name: "UnexpectedRequestError",
      error: unwrapErr(result),
    });
  }
  const socket = unwrapOk(result);
  const pullResult = await pull(project, title);
  if (isErr(pullResult)) return pullResult;
  let metadata = unwrapOk(pullResult);

  try {
    let attempts = 0;
    let changes: Change[] | [DeletePageChange] | [PinChange] = [];
    let reason: "NotFastForwardError" | "DuplicateTitleError" | undefined;

    // Outer loop: handles diff creation and conflict resolution
    // This loop continues until either:
    // 1. Changes are successfully pushed
    // 2. Operation is cancelled (empty changes)
    // 3. Maximum attempts are reached
    while (
      options?.maxAttempts === undefined || attempts < options.maxAttempts
    ) {
      // Generate changes based on current page state
      // If retrying, previous changes and failure reason are provided
      const pending = makeCommit(metadata, attempts, changes, reason);
      changes = pending instanceof Promise ? await pending : pending;
      attempts++;

      // Empty changes indicate operation cancellation
      if (changes.length === 0) return createOk(metadata.commitId);

      // Prepare commit data for WebSocket transmission
      const data: PageCommit = {
        kind: "page",                    // Indicates page modification
        projectId: metadata.projectId,   // Project scope
        pageId: metadata.id,             // Target page
        parentId: metadata.commitId,     // Base commit for change
        userId: metadata.userId,         // Change author
        changes,                         // Actual modifications
        cursor: null,                    // No cursor position
        freeze: true,                    // Prevent concurrent edits
      };

      // Inner loop: handles WebSocket communication and error recovery
      // This loop continues until either:
      // 1. Changes are successfully pushed
      // 2. Fatal error occurs
      // 3. Conflict requires regenerating changes
      while (true) {
        const result = await emit(socket, "commit", data);
        if (isOk(result)) {
          // Update local commit ID on successful push
          metadata.commitId = unwrapOk(result).commitId;
          return createOk(metadata.commitId);
        }

        const error = unwrapErr(result);
        const name = error.name;

        // Fatal errors: connection or protocol issues
        if (
          name === "SocketIOServerDisconnectError" ||
          name === "UnexpectedRequestError"
        ) {
          return createErr(error);
        }

        // Temporary errors: retry after delay
        if (name === "TimeoutError" || name === "SocketIOError") {
          await delay(3000);  // Wait 3 seconds before retry
          continue;           // Retry push with same changes
        }

        // Conflict error: page was modified by another user
        if (name === "NotFastForwardError") {
          await delay(1000);  // Brief delay to avoid rapid retries
          // Fetch latest page state
          const pullResult = await pull(project, title);
          if (isErr(pullResult)) return pullResult;
          metadata = unwrapOk(pullResult);
        }

        // Store error for next attempt and regenerate changes
        reason = name;
        break;  // Exit push loop, retry with new changes
      }
    }

    // All retry attempts exhausted
    return createErr({
      name: "RetryError",
      attempts,
      // Error message format from Deno standard library
      message: `Retrying exceeded the maxAttempts (${attempts}).`,
    });
  } finally {
    // Clean up WebSocket connection if we created it
    if (!options?.socket) await disconnect(socket);
  }
};
