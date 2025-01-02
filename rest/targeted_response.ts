import type { StatusCode, SuccessfulStatus } from "jsr:@std/http";
import type { JsonCompatible } from "./json_compatible.ts";

export type { StatusCode, SuccessfulStatus };

/**
 * Maps a record of status codes and response body types to a union of {@linkcode TargetedResponse}.
 *
 * ```ts
 * import type { AssertTrue, IsExact } from "jsr:/@std/testing@^1.0.8/types";
 *
 * type MappedResponse = MapTargetedResponse<{
 *   200: { success: true },
 *   404: { error: "Not Found" },
 *   500: string,
 * }>;
 * type _ = AssertTrue<IsExact<MappedResponse,
 *     TargetedResponse<200, { success: true }>
 *   | TargetedResponse<404, { error: "Not Found" }>
 *   | TargetedResponse<500, string>
 * >>;
 * ```
 */
export type MapTargetedResponse<T extends Record<number, unknown>> = {
  [K in keyof T]: K extends number
    ? T[K] extends Response
      ? TargetedResponse<ExtendedStatusCodeNumber & K, T[K]>
    : T[K] extends
      | string
      | Exclude<JsonCompatible<T[K]>, string | number | boolean | null>
      | Uint8Array
      | FormData
      | Blob ? TargetedResponse<ExtendedStatusCodeNumber & K, T[K]>
    : never
    : never;
}[keyof T];
export type ResponseOfEndpoint<
  ResponseBodyMap extends Record<number, unknown> = Record<StatusCode, string>,
> = {
  [Status in keyof ResponseBodyMap]: Status extends number
    ? ResponseBodyMap[Status] extends
      | string
      | Exclude<
        JsonCompatible<ResponseBodyMap[Status]>,
        string | number | boolean | null
      >
      | Uint8Array
      | FormData
      | Blob ? TargetedResponse<
        ExtendedStatusCodeNumber & Status,
        ResponseBodyMap[Status]
      >
    : never
    : never;
}[keyof ResponseBodyMap];

/**
 * Type-safe {@linkcode Response} object
 *
 * @typeParam Status Available [HTTP status codes](https://developer.mozilla.org/docs/Web/HTTP/Status)
 * @typeParam Body response body type returned by {@linkcode TargetedResponse.text}, {@linkcode TargetedResponse.json} or {@linkcode TargetedResponse.formData}
 */
// Add missing status codes
export type ExtendedStatusCode =
  | StatusCode
  | 0
  | 400
  | 401
  | 404
  | 408
  | 414
  | 499
  | 500;

export type ExtendedStatusCodeNumber = ExtendedStatusCode & number;

export interface TargetedResponse<
  Status extends ExtendedStatusCode,
  Body = unknown,
> extends Response {
  /**
   * [HTTP status code](https://developer.mozilla.org/docs/Web/HTTP/Status)
   */
  readonly status: Status;

  /**
   * Status text corresponding to the status code
   */
  readonly statusText: string;

  /**
   * Whether the response is successful or not
   */
  readonly ok: Status extends SuccessfulStatus ? true : false;

  /**
   * Response headers
   */
  readonly headers: Headers;

  /**
   * Response body
   */
  readonly body: ReadableStream<Uint8Array> | null;

  /**
   * Get response body as text
   */
  text(): Promise<string>;

  /**
   * Get response body as JSON
   */
  json(): Promise<Body>;

  /**
   * Get response body as FormData
   */
  formData(): Promise<FormData>;

  /**
   * Clone the response
   */
  clone(): TargetedResponse<Status, Body>;
}
