import type {
  NotFoundError,
  NotLoggedInError,
  NotMemberError,
  Page,
} from "../deps/scrapbox.ts";
import { cookie, makeCustomError, tryToErrorLike } from "./utils.ts";
import { encodeTitleURI } from "../title.ts";
import type { Result } from "./utils.ts";

/** Options for `getPage()` */
export interface GetPageOption {
  /** use `followRename` */ followRename?: boolean;
  /** connect.sid */ sid?: string;
}
/** 指定したページのJSONデータを取得する
 *
 * @param project 取得したいページのproject名
 * @param title 取得したいページのtitle 大文字小文字は問わない
 * @param options オプション
 */
export async function getPage(
  project: string,
  title: string,
  options?: GetPageOption,
): Promise<
  Result<
    Page,
    NotFoundError | NotLoggedInError | NotMemberError
  >
> {
  const path = `https://scrapbox.io/api/pages/${project}/${
    encodeTitleURI(title)
  }?followRename=${options?.followRename ?? true}`;

  const res = await fetch(
    path,
    options?.sid
      ? {
        headers: {
          Cookie: cookie(options.sid),
        },
      }
      : undefined,
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
  const value = (await res.json()) as Page;
  return { ok: true, value };
}
