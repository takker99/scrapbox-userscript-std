import type { StatusCode, SuccessfulStatus } from "jsr:@std/http";
import type { JsonCompatible } from "./json_compatible.ts";
import type {
  ExtendedStatusCode,
  TargetedResponse,
} from "./targeted_response.ts";

/**
 * Creates a successful JSON response
 */
export function createSuccessResponse<Body = unknown>(
  body: Body,
  init?: ResponseInit,
): TargetedResponse<200, Body> {
  const headers = new Headers(init?.headers);
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const raw = new Response(JSON.stringify(body), {
    ...init,
    status: 200,
    headers,
  });

  return Object.assign(raw, {
    ok: true as const,
    status: 200 as const,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
    formData: () => Promise.resolve(new FormData()),
    clone: () => createSuccessResponse(body, init),
    body: raw.body,
    bodyUsed: raw.bodyUsed,
    redirected: raw.redirected,
    type: raw.type,
    url: raw.url,
  }) as TargetedResponse<200, Body>;
}

/**
 * Creates an error JSON response
 */
export function createErrorResponse<
  Status extends Exclude<ExtendedStatusCode, SuccessfulStatus>,
  Body = unknown,
>(
  status: Status,
  body: Body,
  init?: ResponseInit,
): TargetedResponse<Status, Body> {
  const headers = new Headers(init?.headers);
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const raw = new Response(JSON.stringify(body), {
    ...init,
    status,
    headers,
  });

  return Object.assign(raw, {
    ok: false as const,
    status,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
    formData: () => Promise.resolve(new FormData()),
    clone: () => createErrorResponse(status, body, init),
    body: raw.body,
    bodyUsed: raw.bodyUsed,
    redirected: raw.redirected,
    type: raw.type,
    url: raw.url,
  }) as TargetedResponse<Status, Body>;
}

/**
 * Creates a TargetedResponse from a standard Response
 */
export function createTargetedResponse<
  Status extends StatusCode,
  Body extends
    | string
    | Exclude<JsonCompatible<Body>, string | number | boolean | null>
    | Uint8Array
    | FormData
    | Blob,
>(
  response: Response,
): TargetedResponse<Status, Body> {
  return Object.assign(response, {
    status: response.status as Status,
    ok: response.ok as Status extends SuccessfulStatus ? true : false,
    text: () => response.text() as Promise<string>,
    json: () => response.json() as Promise<Body>,
    formData: () => response.formData() as Promise<FormData>,
  }) as TargetedResponse<Status, Body>;
}
