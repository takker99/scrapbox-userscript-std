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
 * @param input - The resource URL or a {@linkcode Request} object.
 * @param init - An optional object containing request options.
 * @returns A promise that resolves to a {@linkcode Result} object containing either a {@linkcode Request} or an error.
 */
export type RobustFetch = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Result<Response, FetchError>>;

/**
 * A simple implementation of {@linkcode RobustFetch} that uses {@linkcode fetch}.
 *
 * @param input - The resource URL or a {@linkcode Request} object.
 * @param init - An optional object containing request options.
 * @returns A promise that resolves to a {@linkcode Result} object containing either a {@linkcode Request} or an error.
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
