import { ScrapboxResponse } from "./response.ts";

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
 * @returns A promise that resolves to a {@linkcode ScrapboxResponse} object.
 */
export type RobustFetch = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<ScrapboxResponse<Response, FetchError>>;

/**
 * A simple implementation of {@linkcode RobustFetch} that uses {@linkcode fetch}.
 *
 * @param input - The resource URL or a {@linkcode Request} object.
 * @param init - An optional object containing request options.
 * @returns A promise that resolves to a {@linkcode ScrapboxResponse} object.
 */
export const robustFetch: RobustFetch = async (input, init) => {
  const request = new Request(input, init);
  try {
    const response = await globalThis.fetch(request);
    return ScrapboxResponse.from(response);
  } catch (e: unknown) {
    if (e instanceof DOMException && e.name === "AbortError") {
      return ScrapboxResponse.error({
        name: "AbortError",
        message: e.message,
        request,
      }, { status: 499 }); // Use 499 for client closed request
    }
    if (e instanceof TypeError) {
      return ScrapboxResponse.error({
        name: "NetworkError",
        message: e.message,
        request,
      }, { status: 0 }); // Use 0 for network errors
    }
    throw e;
  }
};
