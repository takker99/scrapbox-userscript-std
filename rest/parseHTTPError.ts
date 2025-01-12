import type {
  BadRequestError,
  InvalidURLError,
  NoQueryError,
  NotFoundError,
  NotLoggedInError,
  NotMemberError,
  NotPrivilegeError,
  SessionError,
} from "@cosense/types/rest";
import type { Maybe } from "option-t/maybe";
import { isArrayOf } from "@core/unknownutil/is/array-of";
import { isLiteralOneOf } from "@core/unknownutil/is/literal-one-of";
import { isRecord } from "@core/unknownutil/is/record";
import { isString } from "@core/unknownutil/is/string";

import type { HTTPError } from "./responseIntoResult.ts";

export interface RESTfullAPIErrorMap {
  BadRequestError: BadRequestError;
  NotFoundError: NotFoundError;
  NotLoggedInError: NotLoggedInError;
  NotMemberError: NotMemberError;
  SessionError: SessionError;
  InvalidURLError: InvalidURLError;
  NoQueryError: NoQueryError;
  NotPrivilegeError: NotPrivilegeError;
}

/**
 * Extracts error information from a failed HTTP request
 *
 * This function parses the response from a failed HTTP request to extract structured error information.
 * It handles various error types including authentication, permission, and validation errors.
 *
 * @returns A {@linkcode Maybe}<T> containing:
 *          - Success: The specific error type requested in `errorNames`
 *          - Error: {@linkcode null} if the error type doesn't match
 */
export const parseHTTPError = async <
  ErrorNames extends keyof RESTfullAPIErrorMap,
>(
  error: HTTPError,
  errorNames: ErrorNames[],
): Promise<Maybe<RESTfullAPIErrorMap[ErrorNames]>> => {
  const res = error.response.clone();
  const isErrorNames = isLiteralOneOf(errorNames);
  try {
    const json: unknown = await res.json();
    if (!isRecord(json)) return;
    if (res.status === 422) {
      if (!isString(json.message)) return;
      for (
        const name of [
          "NoQueryError",
          "InvalidURLError",
        ] as (keyof RESTfullAPIErrorMap)[]
      ) {
        if (!(errorNames as string[]).includes(name)) continue;
        return {
          name,
          message: json.message,
        } as unknown as RESTfullAPIErrorMap[ErrorNames];
      }
    }
    if (!isErrorNames(json.name)) return;
    if (!isString(json.message)) return;
    if (json.name === "NotLoggedInError") {
      if (!isRecord(json.detals)) return;
      if (!isString(json.detals.project)) return;
      if (!isArrayOf(isLoginStrategies)(json.detals.loginStrategies)) return;
      return {
        name: json.name,
        message: json.message,
        details: {
          project: json.detals.project,
          loginStrategies: json.detals.loginStrategies,
        },
      } as unknown as RESTfullAPIErrorMap[ErrorNames];
    }
    return {
      name: json.name,
      message: json.message,
    } as unknown as RESTfullAPIErrorMap[ErrorNames];
  } catch (e: unknown) {
    if (e instanceof SyntaxError) return;
    // Re-throw all errors except JSON parse errors (SyntaxError)
    throw e;
  }
};

const isLoginStrategies = /* @__PURE__ */ isLiteralOneOf(
  [
    "google",
    "github",
    "microsoft",
    "gyazo",
    "email",
    "saml",
    "easy-trial",
  ] as const,
);
