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

/** Retrieve the title of a web page through Scrapbox's server
 *
 * This function fetches the title of a web page by making a request through
 * Scrapbox's server. This approach helps handle various edge cases and
 * authentication requirements that might be needed to access certain pages.
 *
 * @param url The URL of the web page to fetch the title from. Can be either
 *           a string or URL object.
 * @param init Optional configuration including:
 * @returns A {@linkcode Result} containing either:
 *          - Success: The page title as a string
 *          - Error: One of several possible errors:
 *            - {@linkcode SessionError}: Authentication issues
 *            - {@linkcode InvalidURLError}: Malformed or invalid URL
 *            - {@linkcode BadRequestError}: API request issues
 *            - {@linkcode HTTPError}: Network or server errors
 *
 * @example
 * ```typescript
 * const result = await getWebPageTitle("https://example.com");
 * if (isErr(result)) {
 *   console.error("Failed to get page title:", result.err);
 *   return;
 * }
 * const title = result.val;
 * console.log("Page title:", title);
 * ```
 *
 * > [!NOTE]
 * > The function includes a 3000ms timeout for the API request.
 */
export const getWebPageTitle = async (
  url: string | URL,
  init?: ExtendedOptions,
): Promise<Result<string, WebPageTitleError | FetchError>> => {
  const { sid, hostName, fetch } = setDefaults(init ?? {});

  const csrfResult = await getCSRFToken(init);
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
