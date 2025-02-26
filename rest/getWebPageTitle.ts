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
 * @param url - The URL of the web page to fetch the title from. Can be either
 *           a {@linkcode string} or {@linkcode URL} object.
 * @param init - Optional {@linkcode RequestInit} configuration for customizing the request behavior
 * @returns A {@linkcode Result}<{@linkcode string}, {@linkcode Error}> containing:
 *          - Success: The page title as a string
 *          - Error: One of several possible errors:
 *            - {@linkcode SessionError}: Authentication issues
 *            - {@linkcode InvalidURLError}: Malformed or invalid URL
 *            - {@linkcode BadRequestError}: API request issues
 *            - {@linkcode HTTPError}: Network or server errors
 *
 * @example
 * ```typescript
 * import { isErr, unwrapErr, unwrapOk } from "option-t/plain_result";
 *
 * const result = await getWebPageTitle("https://example.com");
 * if (isErr(result)) {
 *   throw new Error(`Failed to get page title: ${unwrapErr(result)}`);
 * }
 * console.log("Page title:", unwrapOk(result));
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
