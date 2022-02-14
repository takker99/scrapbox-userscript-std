import type {
  NotFoundError,
  NotLoggedInError,
  NotMemberError,
} from "../deps/scrapbox.ts";
import {
  cookie,
  getCSRFToken,
  makeCustomError,
  tryToErrorLike,
} from "./utils.ts";
import type { Result } from "./utils.ts";

/** `replaceLinks`の認証情報 */
export interface ReplaceLinksInit {
  /** connect.sid */ sid: string;
  /** CSRF token
   *
   * If it isn't set, automatically get CSRF token from scrapbox.io server.
   */
  csrf?: string;
}

/** 指定したproject内の全てのリンクを書き換える
 *
 * リンクと同一のタイトルは書き換わらないので注意
 * - タイトルも書き換えたいときは/browser/mod.tsの`patch()`などで書き換えること
 *
 * @param project これで指定したproject内の全てのリンクが置換対象となる
 * @param from 置換前のリンク
 * @param to 置換後のリンク
 * @param options connect.sidなど
 * @return 置換されたリンクがあったページの数
 */
export async function replaceLinks(
  project: string,
  from: string,
  to: string,
  init?: ReplaceLinksInit,
): Promise<
  Result<
    number,
    NotFoundError | NotLoggedInError | NotMemberError
  >
> {
  const path = `https://scrapbox.io/api/pages/${project}/replace/links`;
  const sid = init?.sid;
  const csrf = init?.csrf ?? await getCSRFToken(sid);

  const res = await fetch(
    path,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json;charset=utf-8",
        "X-CSRF-TOKEN": csrf,
        ...(sid
          ? {
            Cookie: cookie(sid),
          }
          : {}),
      },
      body: JSON.stringify({ from, to }),
    },
  );

  if (!res.ok) {
    const value = tryToErrorLike(await res.text()) as
      | false
      | NotFoundError
      | NotLoggedInError
      | NotMemberError;
    if (!value) {
      throw makeCustomError(
        "UnexpectedError",
        `Unexpected error has occuerd when fetching "${path}"`,
      );
    }
    return {
      ok: false,
      value,
    };
  }

  // messageには"2 pages have been successfully updated!"というような文字列が入っているはず
  const { message } = (await res.json()) as { message: string };
  return { ok: true, value: parseInt(message.match(/\d+/)?.[0] ?? "0") };
}
