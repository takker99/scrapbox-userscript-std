import type {
  NotFoundError,
  NotLoggedInError,
  NotMemberError,
  Page,
  PageList,
} from "../deps/scrapbox.ts";
import { cookie } from "./auth.ts";
import { UnexpectedResponseError } from "./error.ts";
import { tryToErrorLike } from "../is.ts";
import { encodeTitleURI } from "../title.ts";
import { BaseOptions, Result, setDefaults } from "./util.ts";

/** Options for `getPage()` */
export interface GetPageOption extends BaseOptions {
  /** use `followRename` */ followRename?: boolean;
}
/** 指定したページのJSONデータを取得する
 *
 * @param project 取得したいページのproject名
 * @param title 取得したいページのtitle 大文字小文字は問わない
 * @param options オプション
 */
export const getPage = async (
  project: string,
  title: string,
  options?: GetPageOption,
): Promise<
  Result<
    Page,
    NotFoundError | NotLoggedInError | NotMemberError
  >
> => {
  const { sid, hostName, fetch, followRename } = setDefaults(options ?? {});
  const path = `https://${hostName}/api/pages/${project}/${
    encodeTitleURI(title)
  }?followRename=${followRename ?? true}`;
  const res = await fetch(
    path,
    sid ? { headers: { Cookie: cookie(sid) } } : undefined,
  );
  if (!res.ok) {
    const text = await res.text();
    const value = tryToErrorLike(text);
    if (!value) {
      throw new UnexpectedResponseError({
        path: new URL(path),
        ...res,
        body: text,
      });
    }
    return {
      ok: false,
      value: value as
        | NotFoundError
        | NotLoggedInError
        | NotMemberError,
    };
  }
  const value = (await res.json()) as Page;
  return { ok: true, value };
};

/** Options for `listPages()` */
export interface ListPagesOption extends BaseOptions {
  /** the sort of page list to return
   *
   * @default "updated"
   */
  sort?:
    | "updatedWithMe"
    | "updated"
    | "created"
    | "accessed"
    | "pageRank"
    | "linked"
    | "views"
    | "title";
  /** the index getting page list from
   *
   * @default 0
   */
  skip?: number;
  /** threshold of the length of page list
   *
   * @default 100
   */
  limit?: number;
}
/** 指定したprojectのページを一覧する
 *
 * @param project 一覧したいproject
 * @param options オプション 取得範囲や並び順を決める
 */
export const listPages = async (
  project: string,
  options?: ListPagesOption,
): Promise<
  Result<
    PageList,
    NotFoundError | NotLoggedInError | NotMemberError
  >
> => {
  const { sid, hostName, fetch, sort, limit, skip } = setDefaults(
    options ?? {},
  );
  const params = new URLSearchParams();
  if (sort !== undefined) params.append("sort", sort);
  if (limit !== undefined) params.append("limit", `${limit}`);
  if (skip !== undefined) params.append("skip", `${skip}`);
  const path = `https://${hostName}/api/pages/${project}?${params.toString()}`;

  const res = await fetch(
    path,
    sid ? { headers: { Cookie: cookie(sid) } } : undefined,
  );
  if (!res.ok) {
    const text = await res.text();
    const value = tryToErrorLike(text);
    if (!value) {
      throw new UnexpectedResponseError({
        path: new URL(path),
        ...res,
        body: text,
      });
    }
    return {
      ok: false,
      value: value as
        | NotFoundError
        | NotLoggedInError
        | NotMemberError,
    };
  }
  const value = (await res.json()) as PageList;
  return { ok: true, value };
};
