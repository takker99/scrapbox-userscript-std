import { createOk, mapForResult, type Result } from "option-t/plain_result";
import { getProfile } from "./profile.ts";
import type { HTTPError } from "./responseIntoResult.ts";
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
): Promise<Result<string, NetworkError | AbortError | HTTPError>> => {
  // deno-lint-ignore no-explicit-any
  const csrf = init?.csrf ?? (globalThis as any)._csrf;
  return csrf ? createOk(csrf) : mapForResult(
    await getProfile(init),
    (user) => user.csrfToken,
  );
};
