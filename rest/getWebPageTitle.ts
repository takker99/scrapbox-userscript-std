import type {
  BadRequestError,
  InvalidURLError,
  SessionError,
} from "@cosense/types/rest";
import { cookie, getCSRFToken } from "./auth.ts";
import { parseHTTPError } from "./parseHTTPError.ts";
import { type ExtendedOptions, setDefaults } from "./options.ts";
import type { TargetedResponse } from "./targeted_response.ts";
import {
  createErrorResponse,
  createSuccessResponse,
  createTargetedResponse,
} from "./utils.ts";
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
): Promise<
  TargetedResponse<200 | 400 | 404, string | WebPageTitleError | FetchError>
> => {
  const { sid, hostName, fetch } = setDefaults(init ?? {});

  const csrfToken = await getCSRFToken(init);
  if (!csrfToken.ok) return csrfToken;

  const req = new Request(
    `https://${hostName}/api/embed-text/url?url=${
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
  const response = createTargetedResponse<200 | 400 | 404, WebPageTitleError>(
    res,
  );

  await parseHTTPError(response, [
    "SessionError",
    "BadRequestError",
    "InvalidURLError",
  ]);

  if (response.ok) {
    const { title } = await response.json() as { title: string };
    return createSuccessResponse(title);
  }

  return response;
};
