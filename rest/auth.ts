import { getProfile } from "./profile.ts";
import { BaseOptions } from "./util.ts";

// scrapbox.io内なら`window._csrf`にCSRF tokenが入っている
declare global {
  // globalThisに変数を宣言するには、`var`を使うしかない
  // deno-lint-ignore no-var
  var _csrf: string | undefined;
}

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
  if (globalThis._csrf) return globalThis._csrf;

  const user = await getProfile(init);
  return user.csrfToken;
};
