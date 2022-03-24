import type {
  BadRequestError,
  InvalidURLError,
  SessionError,
  TweetInfo,
} from "../deps/scrapbox.ts";
import { cookie, getCSRFToken } from "./auth.ts";
import { UnexpectedResponseError } from "./error.ts";
import { tryToErrorLike } from "../is.ts";
import { ExtendedOptions, Result, setDefaults } from "./util.ts";

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
  >
> => {
  const { sid, hostName, fetch, csrf } = setDefaults(init ?? {});
  const path = `https://${hostName}/api/embed-text/twitter?url=${
    encodeURIComponent(url.toString())
  }`;

  const res = await fetch(
    path,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json;charset=utf-8",
        "X-CSRF-TOKEN": csrf ?? await getCSRFToken(init),
        ...(sid ? { Cookie: cookie(sid) } : {}),
      },
      body: JSON.stringify({ timeout: 3000 }),
    },
  );

  if (!res.ok) {
    if (res.status === 422) {
      return {
        ok: false,
        value: {
          name: "InvalidURLError",
          message: (await res.json()).message as string,
        },
      };
    }
    const text = await res.json();
    const value = tryToErrorLike(text);
    if (!value) {
      throw new UnexpectedResponseError({
        path: new URL(path),
        ...res,
        body: await res.text(),
      });
    }
    return {
      ok: false,
      value: value as
        | SessionError
        | BadRequestError,
    };
  }

  const tweet = (await res.json()) as TweetInfo;
  return { ok: true, value: tweet };
};
