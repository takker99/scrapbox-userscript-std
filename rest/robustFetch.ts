import type { StatusCode as _StatusCode } from "jsr:@std/http";
import type { TargetedResponse } from "./targeted_response.ts";
import {
  createErrorResponse,
  type createSuccessResponse as _createSuccessResponse,
  type createTargetedResponse as _createTargetedResponse,
} from "./utils.ts";

export interface NetworkError extends Response {
  name: "NetworkError";
  message: string;
  request: Request;
  ok: false;
  status: 500;
  statusText: "Network Error";
}

export interface AbortError extends Response {
  name: "AbortError";
  message: string;
  request: Request;
  ok: false;
  status: 408;
  statusText: "Request Timeout";
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
) => Promise<
  | TargetedResponse<200, Response>
  | TargetedResponse<400 | 404, Response>
  | TargetedResponse<408, AbortError>
  | TargetedResponse<500, NetworkError>
>;

/**
 * A simple implementation of {@linkcode RobustFetch} that uses {@linkcode fetch}.
 *
 * @param input - The resource URL or a {@linkcode Request} object.
 * @param init - An optional object containing request options.
 * @returns A promise that resolves to a {@linkcode TargetedResponse} object.
 */
export const robustFetch: RobustFetch = async (input, init): Promise<
  | TargetedResponse<200, Response>
  | TargetedResponse<400 | 404, Response>
  | TargetedResponse<408, AbortError>
  | TargetedResponse<500, NetworkError>
> => {
  const request = new Request(input, init);
  try {
    const response = await globalThis.fetch(request);
    if (response.ok) {
      return response as TargetedResponse<200, Response>;
    }
    return response as TargetedResponse<400 | 404, Response>;
  } catch (e: unknown) {
    if (e instanceof DOMException && e.name === "AbortError") {
      const error = new Response(null, {
        status: 408,
        statusText: "Request Timeout",
      });
      Object.assign(error, {
        name: "AbortError" as const,
        message: e.message,
        request: request.clone(),
      });
      return createErrorResponse(408, error as AbortError);
    }
    if (e instanceof TypeError) {
      const error = new Response(null, {
        status: 500,
        statusText: "Network Error",
      });
      Object.assign(error, {
        name: "NetworkError" as const,
        message: e.message,
        request: request.clone(),
      });
      return createErrorResponse(500, error as NetworkError);
    }
    throw e;
  }
};
