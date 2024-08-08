import {
  isErr,
  mapAsyncForResult,
  mapErrAsyncForResult,
  type Result,
  unwrapOk,
} from "option-t/plain_result";
import type {
  BadRequestError,
  InvalidURLError,
  SessionError,
  TweetInfo,
} from "@cosense/types/rest";
import { cookie, getCSRFToken } from "./auth.ts";
import { parseHTTPError } from "./parseHTTPError.ts";
import { type HTTPError, responseIntoResult } from "./responseIntoResult.ts";
import { type ExtendedOptions, setDefaults } from "./options.ts";
import type { FetchError } from "./mod.ts";

export type TweetInfoError =
  | SessionError
  | InvalidURLError
  | BadRequestError
  | HTTPError;

/** 指定したTweetの情報を取得する
 *
 * @param url 取得したいTweetのURL
 * @param init connect.sidなど
 * @return tweetの中身とか
 */
export const getTweetInfo = async (
  url: string | URL,
  init?: ExtendedOptions,
): Promise<Result<TweetInfo, TweetInfoError | FetchError>> => {
  const { sid, hostName, fetch } = setDefaults(init ?? {});

  const csrfResult = await getCSRFToken(init);
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
