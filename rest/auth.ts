import { getProfile } from "./profile.ts";
import type { BaseOptions } from "./util.ts";

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
  init?: BaseOptions,
): Promise<string> => {
  // deno-lint-ignore no-explicit-any
  if ((globalThis as any)._csrf) return (globalThis as any)._csrf;

  const user = await getProfile(init);
  return user.csrfToken;
};
