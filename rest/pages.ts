import type {
  ErrorLike,
  NotFoundError,
  NotLoggedInError,
  NotMemberError,
  Page,
  PageList,
} from "../deps/scrapbox-rest.ts";
import { cookie } from "./auth.ts";
import { makeError } from "./error.ts";
import { encodeTitleURI } from "../title.ts";
import { type BaseOptions, type Result, setDefaults } from "./util.ts";

/** Options for `getPage()` */
export interface GetPageOption extends BaseOptions {
  /** use `followRename` */
  followRename?: boolean;

  /** project ids to get External links */
  projects?: string[];
}

export interface TooLongURIError extends ErrorLike {
  name: "TooLongURIError";
}

const getPage_toRequest: GetPage["toRequest"] = (
  project,
  title,
  options,
) => {
  const { sid, hostName, followRename, projects } = setDefaults(options ?? {});
  const params = new URLSearchParams();
  params.append("followRename", `${followRename ?? true}`);
  for (const id of projects ?? []) {
    params.append("projects", id);
  }
  const path = `https://${hostName}/api/pages/${project}/${
    encodeTitleURI(title)
  }?${params.toString()}`;

  return new Request(
    path,
    sid ? { headers: { Cookie: cookie(sid) } } : undefined,
  );
};

const getPage_fromResponse: GetPage["fromResponse"] = async (res) => {
  if (!res.ok) {
    if (res.status === 414) {
      return {
        ok: false,
        value: {
          name: "TooLongURIError",
          message: "project ids may be too much.",
        },
      };
    }
    return makeError<NotFoundError | NotLoggedInError | NotMemberError>(res);
  }
  const value = (await res.json()) as Page;
  return { ok: true, value };
};

export interface GetPage {
  /** /api/pages/:project/:title の要求を組み立てる
   *
   * @param project 取得したいページのproject名
   * @param title 取得したいページのtitle 大文字小文字は問わない
   * @param options オプション
   * @return request
   */
  toRequest: (
    project: string,
    title: string,
    options?: GetPageOption,
  ) => Request;

  /** 帰ってきた応答からページのJSONデータを取得する
   *
   * @param res 応答
   * @return ページのJSONデータ
   */
  fromResponse: (res: Response) => Promise<
    Result<
      Page,
      NotFoundError | NotLoggedInError | NotMemberError | TooLongURIError
    >
  >;

  (project: string, title: string, options?: GetPageOption): Promise<
    Result<
      Page,
      NotFoundError | NotLoggedInError | NotMemberError | TooLongURIError
    >
  >;
}

/** 指定したページのJSONデータを取得する
 *
 * @param project 取得したいページのproject名
 * @param title 取得したいページのtitle 大文字小文字は問わない
 * @param options オプション
 */
export const getPage: GetPage = async (
  project,
  title,
  options,
) => {
  const { fetch } = setDefaults(options ?? {});
  const req = getPage_toRequest(project, title, options);
  const res = await fetch(req);
  return await getPage_fromResponse(res);
};

getPage.toRequest = getPage_toRequest;
getPage.fromResponse = getPage_fromResponse;

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

export interface ListPages {
  /** /api/pages/:project の要求を組み立てる
   *
   * @param project 取得したいページのproject名
   * @param options オプション
   * @return request
   */
  toRequest: (
    project: string,
    options?: ListPagesOption,
  ) => Request;

  /** 帰ってきた応答からページのJSONデータを取得する
   *
   * @param res 応答
   * @return ページのJSONデータ
   */
  fromResponse: (res: Response) => Promise<
    Result<
      PageList,
      NotFoundError | NotLoggedInError | NotMemberError
    >
  >;

  (project: string, options?: ListPagesOption): Promise<
    Result<
      PageList,
      NotFoundError | NotLoggedInError | NotMemberError
    >
  >;
}

const listPages_toRequest: ListPages["toRequest"] = (project, options) => {
  const { sid, hostName, sort, limit, skip } = setDefaults(
    options ?? {},
  );
  const params = new URLSearchParams();
  if (sort !== undefined) params.append("sort", sort);
  if (limit !== undefined) params.append("limit", `${limit}`);
  if (skip !== undefined) params.append("skip", `${skip}`);
  const path = `https://${hostName}/api/pages/${project}?${params.toString()}`;

  return new Request(
    path,
    sid ? { headers: { Cookie: cookie(sid) } } : undefined,
  );
};

const listPages_fromResponse: ListPages["fromResponse"] = async (res) => {
  if (!res.ok) {
    return makeError<NotFoundError | NotLoggedInError | NotMemberError>(res);
  }
  const value = (await res.json()) as PageList;
  return { ok: true, value };
};

/** 指定したprojectのページを一覧する
 *
 * @param project 一覧したいproject
 * @param options オプション 取得範囲や並び順を決める
 */
export const listPages: ListPages = async (
  project,
  options?,
) => {
  const { fetch } = setDefaults(options ?? {});
  const res = await fetch(listPages_toRequest(project, options));
  return await listPages_fromResponse(res);
};

listPages.toRequest = listPages_toRequest;
listPages.fromResponse = listPages_fromResponse;
