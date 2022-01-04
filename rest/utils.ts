import type { ErrorLike } from "../deps/scrapbox.ts";

/** HTTP headerのCookieに入れる文字列を作る
 *
 * @param sid connect.sidに入っている文字列
 */
export const cookie = (sid: string) => `connect.sid=${sid}`;

/** CSRF tokenを取得する
 *
 * @param sid - connect.sidに入っている文字列。不正な文字列を入れてもCSRF tokenを取得できるみたい
 */
export async function getCSRFToken(
  sid: string,
): Promise<Result<{ csrfToken: string }, ErrorLike>> {
  const res = await fetch("https://scrapbox.io/api/users/me", {
    headers: { Cookie: cookie(sid) },
  });
  if (!res.ok) {
    const error = (await res.json()) as ErrorLike;
    return { ok: false, ...error };
  }
  const { csrfToken } = (await res.json()) as { csrfToken: string };
  return { ok: true, csrfToken };
}

export type Result<T, E> = ({ ok: true } & T) | ({ ok: false } & E);
