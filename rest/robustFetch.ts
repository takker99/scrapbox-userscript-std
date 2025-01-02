import type { TargetedResponse } from "./targeted_response.ts";
import { createSuccessResponse, createErrorResponse, createTargetedResponse } from "./utils.ts";

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
 * @returns A promise that resolves to a {@linkcode TargetedResponse} object.
 */
export type RobustFetch = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<TargetedResponse<200 | 400 | 404 | 499 | 0, Response | FetchError>>;

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
    return createTargetedResponse<200 | 400 | 404 | 499 | 0, Response>(response);
  } catch (e: unknown) {
    if (e instanceof DOMException && e.name === "AbortError") {
      return createErrorResponse(499, {
        name: "AbortError",
        message: e.message,
        request,
      }); // Use 499 for client closed request
    }
    if (e instanceof TypeError) {
      return createErrorResponse(0, {
        name: "NetworkError",
        message: e.message,
        request,
      }); // Use 0 for network errors
    }
    throw e;
  }
};
