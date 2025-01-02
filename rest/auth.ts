import { getProfile } from "./profile.ts";
import type { TargetedResponse } from "./targeted_response.ts";
import { createErrorResponse, createSuccessResponse } from "./utils.ts";
import type { HTTPError } from "./errors.ts";
import type { AbortError, NetworkError } from "./robustFetch.ts";
import type { ExtendedOptions } from "./options.ts";

/** HTTP headerのCookieに入れる文字列を作る
 *
 * @param sid connect.sidに入っている文字列
 */
export const cookie = (sid: string): string => `connect.sid=${sid}`;

/** CSRF tokenを取得する
 *
 * @param init 認証情報など
 */
export const getCSRFToken = async (
  init?: ExtendedOptions,
): Promise<
  TargetedResponse<
    200 | 400 | 404 | 0 | 499,
    { csrfToken: string } | NetworkError | AbortError | HTTPError
  >
> => {
  // deno-lint-ignore no-explicit-any
  const csrf = init?.csrf ?? (globalThis as any)._csrf;
  if (csrf) {
    return createSuccessResponse({ csrfToken: csrf });
  }

  const profile = await getProfile(init);
  if (!profile.ok) return profile;

  const data = await profile.json();
  if (!("csrfToken" in data)) {
    return createErrorResponse(400, {
      name: "HTTPError",
      message: "Invalid response format",
      status: 400,
      statusText: "Bad Request",
    });
  }
  return createSuccessResponse({ csrfToken: data.csrfToken });
};
