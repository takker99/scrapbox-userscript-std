import type {
  BadRequestError,
  InvalidURLError,
  NoQueryError,
  NotFoundError,
  NotLoggedInError,
  NotMemberError,
  NotPrivilegeError,
  SessionError,
} from "../deps/scrapbox-rest.ts";
import type { Maybe } from "../deps/option-t.ts";
import {
  isArrayOf,
  isLiteralOneOf,
  isRecord,
  isString,
} from "../deps/unknownutil.ts";
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

/** 失敗した要求からエラー情報を取り出す */
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
    // JSONのparse error以外はそのまま投げる
    throw e;
  }
};

const isLoginStrategies = isLiteralOneOf(
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
