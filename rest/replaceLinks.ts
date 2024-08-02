import type {
  NotFoundError,
  NotLoggedInError,
  NotMemberError,
} from "../deps/scrapbox-rest.ts";
import { cookie, getCSRFToken } from "./auth.ts";
import { makeError } from "./error.ts";
import { type ExtendedOptions, type Result, setDefaults } from "./util.ts";

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
export const replaceLinks = async (
  project: string,
  from: string,
  to: string,
  init?: ExtendedOptions,
): Promise<
  Result<
    number,
    NotFoundError | NotLoggedInError | NotMemberError
  >
> => {
  const { sid, hostName, fetch, csrf } = setDefaults(init ?? {});

  const req = new Request(
    `https://${hostName}/api/pages/${project}/replace/links`,
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

  const res = await fetch(req);

  if (!res.ok) {
    return makeError<NotFoundError | NotLoggedInError | NotMemberError>(res);
  }

  // messageには"2 pages have been successfully updated!"というような文字列が入っているはず
  const { message } = (await res.json()) as { message: string };
  return { ok: true, value: parseInt(message.match(/\d+/)?.[0] ?? "0") };
};
