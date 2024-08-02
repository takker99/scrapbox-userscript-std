import {
  isErr,
  mapAsyncForResult,
  mapErrAsyncForResult,
  orElseAsyncForResult,
  type Result,
  unwrapOk,
} from "option-t/plain_result";
import { toResultOkFromMaybe } from "option-t/maybe";
import type {
  BadRequestError,
  InvalidURLError,
  SessionError,
} from "@cosense/types/rest";
import { cookie, getCSRFToken } from "./auth.ts";
import { parseHTTPError } from "./parseHTTPError.ts";
import { type HTTPError, responseIntoResult } from "./responseIntoResult.ts";
import { type ExtendedOptions, setDefaults } from "./options.ts";
import type { FetchError } from "./mod.ts";

export type WebPageTitleError =
  | SessionError
  | InvalidURLError
  | BadRequestError
  | HTTPError;

/** 指定したURLのweb pageのtitleをscrapboxのserver経由で取得する
 *
 * @param url 取得したいURL
 * @param init connect.sidなど
 * @return web pageのtilte
 */
export const getWebPageTitle = async (
  url: string | URL,
  init?: ExtendedOptions,
): Promise<Result<string, WebPageTitleError | FetchError>> => {
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
