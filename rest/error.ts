import type { ErrorLike } from "../deps/scrapbox-rest.ts";
import { tryToErrorLike } from "../is.ts";

/** 想定されない応答が帰ってきたときに投げる例外 */
export class UnexpectedResponseError extends Error {
  name = "UnexpectedResponseError";

  constructor(
    public response: Response,
  ) {
    super(
      `${response.status} ${response.statusText} when fetching ${response.url}`,
    );

    // @ts-ignore only available on V8
    if (Error.captureStackTrace) {
      // @ts-ignore only available on V8
      Error.captureStackTrace(this, UnexpectedResponseError);
    }
  }
}

/** 失敗した要求からエラー情報を取り出す */
export const makeError = async <T extends ErrorLike>(
  res: Response,
): Promise<{ ok: false; value: T }> => {
  const response = res.clone();
  const text = await response.text();
  const value = tryToErrorLike(text);
  if (!value) {
    throw new UnexpectedResponseError(response);
  }
  return {
    ok: false,
    value: value as T,
  };
};
