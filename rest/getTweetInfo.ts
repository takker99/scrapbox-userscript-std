import {
  isErr,
  mapAsyncForResult,
  mapErrAsyncForResult,
  orElseAsyncForResult,
  type Result,
  toResultOkFromMaybe,
  unwrapOk,
} from "../deps/option-t.ts";
import type {
  BadRequestError,
  InvalidURLError,
  SessionError,
  TweetInfo,
} from "../deps/scrapbox-rest.ts";
import { cookie, getCSRFToken } from "./auth.ts";
import { parseHTTPError } from "./parseHTTPError.ts";
import { type HTTPError, responseIntoResult } from "./responseIntoResult.ts";
import type { AbortError, NetworkError } from "./robustFetch.ts";
import { type ExtendedOptions, setDefaults } from "./util.ts";

/** 指定したTweetの情報を取得する
 *
 * @param url 取得したいTweetのURL
 * @param init connect.sidなど
 * @return tweetの中身とか
 */
export const getTweetInfo = async (
  url: string | URL,
  init?: ExtendedOptions,
): Promise<
  Result<
    TweetInfo,
    | SessionError
    | InvalidURLError
    | BadRequestError
    | NetworkError
    | AbortError
    | HTTPError
  >
> => {
  const { sid, hostName, fetch, csrf } = setDefaults(init ?? {});

  const csrfResult = await orElseAsyncForResult(
    toResultOkFromMaybe(csrf),
    () => getCSRFToken(init),
  );
  if (isErr(csrfResult)) return csrfResult;

  const req = new Request(
    `https://${hostName}/api/embed-text/twitter?url=${
      encodeURIComponent(`${url}`)
    }`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json;charset=utf-8",
        "X-CSRF-TOKEN": unwrapOk(csrfResult),
        ...(sid ? { Cookie: cookie(sid) } : {}),
      },
      body: JSON.stringify({ timeout: 3000 }),
    },
  );

  const res = await fetch(req);
  if (isErr(res)) return res;

  return mapErrAsyncForResult(
    await mapAsyncForResult(
      responseIntoResult(unwrapOk(res)),
      (res) => res.json() as Promise<TweetInfo>,
    ),
    async (res) => {
      if (res.response.status === 422) {
        return {
          name: "InvalidURLError",
          message: (await res.response.json()).message as string,
        };
      }
      const parsed = await parseHTTPError(res, [
        "SessionError",
        "BadRequestError",
      ]);
      return parsed ?? res;
    },
  );
};
