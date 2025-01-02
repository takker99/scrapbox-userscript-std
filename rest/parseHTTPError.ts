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
import { isArrayOf } from "@core/unknownutil/is/array-of";
import { isLiteralOneOf } from "@core/unknownutil/is/literal-one-of";
import { isRecord } from "@core/unknownutil/is/record";
import { isString } from "@core/unknownutil/is/string";
import type { TargetedResponse } from "./targeted_response.ts";
import { createErrorResponse as _createErrorResponse } from "./utils.ts";

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

/** Extract error information from a failed request */
export const parseHTTPError = async <
  ErrorNames extends keyof RESTfullAPIErrorMap,
  T = unknown,
  E = unknown,
>(
  response: ScrapboxResponse<T, E>,
  errorNames: ErrorNames[],
): Promise<RESTfullAPIErrorMap[ErrorNames] | undefined> => {
  const res = response.clone();
  const isErrorNames = isLiteralOneOf(errorNames);
  try {
    const json: unknown = await res.json();
    if (!isRecord(json)) return undefined;
    if (res.status === 422) {
      if (!isString(json.message)) return undefined;
      for (
        const name of [
          "NoQueryError",
          "InvalidURLError",
        ] as (keyof RESTfullAPIErrorMap)[]
      ) {
        if (!(errorNames as string[]).includes(name)) continue;
        const error = {
          name,
          message: json.message,
        } as RESTfullAPIErrorMap[ErrorNames];
        Object.assign(response, { error });
        return error;
      }
    }
    if (!isErrorNames(json.name)) return undefined;
    if (!isString(json.message)) return undefined;
    if (json.name === "NotLoggedInError") {
      if (!isRecord(json.detals)) return undefined;
      if (!isString(json.detals.project)) return undefined;
      if (!isArrayOf(isLoginStrategies)(json.detals.loginStrategies)) {
        return undefined;
      }
      const error = {
        name: json.name,
        message: json.message,
        details: {
          project: json.detals.project,
          loginStrategies: json.detals.loginStrategies,
        },
      } as RESTfullAPIErrorMap[ErrorNames];
      Object.assign(response, { error });
      return error;
    }
    const error = {
      name: json.name,
      message: json.message,
    } as RESTfullAPIErrorMap[ErrorNames];
    Object.assign(response, { error });
    return error;
  } catch (e: unknown) {
    if (e instanceof SyntaxError) return undefined;
    // Re-throw non-JSON parse errors
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
