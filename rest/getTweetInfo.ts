import type {
  BadRequestError,
  InvalidURLError,
  SessionError,
  TweetInfo,
} from "@cosense/types/rest";
import { cookie, getCSRFToken } from "./auth.ts";
import { parseHTTPError } from "./parseHTTPError.ts";
import { type ExtendedOptions, setDefaults } from "./options.ts";
import type { TargetedResponse } from "./targeted_response.ts";
import {
  createErrorResponse,
  createSuccessResponse as _createSuccessResponse,
  createTargetedResponse,
} from "./utils.ts";
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
): Promise<
  TargetedResponse<
    200 | 400 | 404 | 422,
    TweetInfo | TweetInfoError | FetchError
  >
> => {
  const { sid, hostName, fetch } = setDefaults(init ?? {});

  const csrfToken = await getCSRFToken(init);
  if (!csrfToken.ok) return csrfToken;

  const req = new Request(
    `https://${hostName}/api/embed-text/twitter?url=${
      encodeURIComponent(`${url}`)
    }`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json;charset=utf-8",
        "X-CSRF-TOKEN": csrfToken.data,
        ...(sid ? { Cookie: cookie(sid) } : {}),
      },
      body: JSON.stringify({ timeout: 3000 }),
    },
  );

  const res = await fetch(req);
  const response = createTargetedResponse<
    200 | 400 | 404 | 422,
    TweetInfoError
  >(res);

  if (response.status === 422) {
    const json = await response.json();
    return createErrorResponse(422, {
      name: "InvalidURLError",
      message: json.message as string,
    });
  }

  await parseHTTPError(response, [
    "SessionError",
    "BadRequestError",
  ]);

  return response;
};
