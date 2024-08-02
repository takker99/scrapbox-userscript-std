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
} from "../deps/scrapbox-rest.ts";
import { cookie, getCSRFToken } from "./auth.ts";
import { parseHTTPError } from "./parseHTTPError.ts";
import { type HTTPError, responseIntoResult } from "./responseIntoResult.ts";
import type { AbortError, NetworkError } from "./robustFetch.ts";
import { type ExtendedOptions, setDefaults } from "./util.ts";

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
    `https://${hostName}/api/embed-text/url?url=${
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

  return mapAsyncForResult(
    await mapErrAsyncForResult(
      responseIntoResult(unwrapOk(res)),
      async (error) =>
        (await parseHTTPError(error, [
          "SessionError",
          "BadRequestError",
          "InvalidURLError",
        ])) ?? error,
    ),
    async (res) => {
      const { title } = (await res.json()) as { title: string };
      return title;
    },
  );
};
