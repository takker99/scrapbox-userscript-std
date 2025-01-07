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

/** Retrieve information about a specified Tweet
 *
 * Fetches metadata and content information for a given Tweet URL through Scrapbox's
 * Twitter embed API. This function handles authentication and CSRF token management
 * automatically.
 *
 * @param url The URL of the Tweet to fetch information for. Can be either a string
 *           or URL object. Should be a valid Twitter/X post URL.
 * @param init Optional configuration including:
 *             - sid: Scrapbox session ID for authentication
 *             - hostName: Custom Scrapbox host name
 *             - fetch: Custom fetch implementation
 * @returns A Result containing either:
 *          - Ok: TweetInfo object with Tweet metadata
 *          - Err: One of several possible errors:
 *            - SessionError: Authentication issues
 *            - InvalidURLError: Malformed or invalid Tweet URL
 *            - BadRequestError: API request issues
 *            - HTTPError: Network or server errors
 *
 * @example
 * ```typescript
 * const result = await getTweetInfo("https://twitter.com/user/status/123456789");
 * if (isErr(result)) {
 *   console.error("Failed to get Tweet info:", result.err);
 *   return;
 * }
 * const tweetInfo = result.val;
 * if (tweetInfo) {
 *   console.log("Tweet text:", tweetInfo.text);
 * }
 * ```
 *
 * Note: The function includes a 3000ms timeout for the API request.
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
