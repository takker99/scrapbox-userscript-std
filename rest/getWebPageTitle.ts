import type {
  BadRequestError,
  InvalidURLError,
  SessionError,
} from "../deps/scrapbox-rest.ts";
import { cookie, getCSRFToken } from "./auth.ts";
import { makeError } from "./error.ts";
import { ExtendedOptions, Result, setDefaults } from "./util.ts";

/** 指定したURLのweb pageのtitleをscrapboxのserver経由で取得する
 *
 * @param url 取得したいURL
 * @param init connect.sidなど
 * @return web pageのtilte
 */
export const getWebPageTitle = async (
  url: string | URL,
  init?: ExtendedOptions,
): Promise<
  Result<
    string,
    | SessionError
    | InvalidURLError
    | BadRequestError
  >
> => {
  const { sid, hostName, fetch, csrf } = setDefaults(init ?? {});

  const req = new Request(
    `https://${hostName}/api/embed-text/url?url=${
      encodeURIComponent(url.toString())
    }`,
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

  const res = await fetch(req);

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
    return makeError<SessionError | BadRequestError>(req, res);
  }

  const { title } = (await res.json()) as { title: string };
  return { ok: true, value: title };
};
