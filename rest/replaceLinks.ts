import type {
  NotFoundError,
  NotLoggedInError,
  NotMemberError,
} from "../deps/scrapbox.ts";
import { cookie, getCSRFToken } from "./auth.ts";
import { UnexpectedResponseError } from "./error.ts";
import { tryToErrorLike } from "../is.ts";
import { ExtendedOptions, Result, setDefaults } from "./util.ts";

/** 指定したproject内の全てのリンクを書き換える
 *
 * リンクと同一のタイトルは書き換わらないので注意
 * - タイトルも書き換えたいときは/browser/mod.tsの`patch()`などで書き換えること
 *
 * @param project これで指定したproject内の全てのリンクが置換対象となる
 * @param from 置換前のリンク
 * @param to 置換後のリンク
 * @param init connect.sidなど
 * @return 置換されたリンクがあったページの数
 */
export async function replaceLinks(
  project: string,
  from: string,
  to: string,
  init?: ExtendedOptions,
): Promise<
  Result<
    number,
    NotFoundError | NotLoggedInError | NotMemberError
  >
> {
  const { sid, hostName, fetch, csrf } = setDefaults(init ?? {});
  const path = `https://${hostName}/api/pages/${project}/replace/links`;

  const res = await fetch(
    path,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json;charset=utf-8",
        "X-CSRF-TOKEN": csrf ?? await getCSRFToken(init),
        ...(sid ? { Cookie: cookie(sid) } : {}),
      },
      body: JSON.stringify({ from, to }),
    },
  );

  if (!res.ok) {
    const text = await res.json();
    const value = tryToErrorLike(text);
    if (!value) {
      throw new UnexpectedResponseError({
        path: new URL(path),
        ...res,
        body: await res.text(),
      });
    }
    return {
      ok: false,
      value: value as NotFoundError | NotMemberError | NotLoggedInError,
    };
  }

  // messageには"2 pages have been successfully updated!"というような文字列が入っているはず
  const { message } = (await res.json()) as { message: string };
  return { ok: true, value: parseInt(message.match(/\d+/)?.[0] ?? "0") };
}
