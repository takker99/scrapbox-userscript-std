import type { StatusCode } from "@std/http";
import type { JsonCompatible } from "./json_compatible.ts";
import type { TargetedResponse } from "./targeted_response.ts";

/**
 * Creates a successful response with JSON content
 */
export function createSuccessResponse<Body extends JsonCompatible<Body>>(
  body: Body,
  init?: Omit<ResponseInit, "status">,
): TargetedResponse<200, Body> {
  const raw = new Response(JSON.stringify(body), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
    ...init,
  });
  return raw as TargetedResponse<200, Body>;
}

/**
 * Creates an error response with JSON content
 */
export function createErrorResponse<
  Status extends Exclude<StatusCode, 200>,
  Body extends JsonCompatible<Body>,
>(
  status: Status,
  body: Body,
  init?: Omit<ResponseInit, "status">,
): TargetedResponse<Status, Body> {
  const raw = new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
    ...init,
  });
  return raw as TargetedResponse<Status, Body>;
}

/**
 * Creates a TargetedResponse from a standard Response
 */
export function createTargetedResponse<
  Status extends StatusCode,
  Body extends JsonCompatible<Body>,
>(response: Response): TargetedResponse<Status, Body> {
  return response as TargetedResponse<Status, Body>;
}
