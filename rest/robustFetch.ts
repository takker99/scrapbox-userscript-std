import { createErr, createOk, type Result } from "option-t/plain_result";

export interface NetworkError {
  name: "NetworkError";
  message: string;
  request: Request;
}

export interface AbortError {
  name: "AbortError";
  message: string;
  request: Request;
}

export type FetchError = NetworkError | AbortError;

/**
 * Represents a function that performs a network request using the Fetch API.
 *
 * @param input - The resource URL (as {@linkcode string} or {@linkcode URL}), {@linkcode RequestInfo}, or a {@linkcode Request} object to fetch
 * @param init - Optional {@linkcode RequestInit} configuration for the request including headers, method, body, etc.
 * @returns A {@linkcode Result}<{@linkcode Response}, {@linkcode FetchError}> containing either:
 *          - Success: A {@linkcode Response} from the successful fetch operation
 *          - Error: One of several possible errors:
 *            - {@linkcode NetworkError}: Network connectivity or DNS resolution failed (from {@linkcode TypeError})
 *            - {@linkcode AbortError}: Request was aborted before completion (from {@linkcode DOMException})
 */
export type RobustFetch = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Result<Response, FetchError>>;

/**
 * A simple implementation of {@linkcode RobustFetch} that uses {@linkcode fetch}.
 *
 * @param input - The resource URL (as {@linkcode string} or {@linkcode URL}), {@linkcode RequestInfo}, or a {@linkcode Request} object to fetch
 * @param init - Optional {@linkcode RequestInit} configuration for the request including headers, method, body, etc.
 * @returns A {@linkcode Result}<{@linkcode Response}, {@linkcode FetchError}> containing either:
 *          - Success: A {@linkcode Response} from the successful fetch operation
 *          - Error: One of several possible errors:
 *            - {@linkcode NetworkError}: Network connectivity or DNS resolution failed (from {@linkcode TypeError})
 *            - {@linkcode AbortError}: Request was aborted before completion (from {@linkcode DOMException})
 */
export const robustFetch: RobustFetch = async (input, init) => {
  const request = new Request(input, init);
  try {
    return createOk(await globalThis.fetch(request));
  } catch (e: unknown) {
    if (e instanceof DOMException && e.name === "AbortError") {
      return createErr({
        name: "AbortError",
        message: e.message,
        request,
      });
    }
    if (e instanceof TypeError) {
      return createErr({
        name: "NetworkError",
        message: e.message,
        request,
      });
    }
    throw e;
  }
};
