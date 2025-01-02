import type {
  ErrorLike,
  NotFoundError,
  NotLoggedInError,
  NotMemberError,
  Page,
  PageList,
} from "@cosense/types/rest";
import { cookie } from "./auth.ts";
import { parseHTTPError } from "./parseHTTPError.ts";
import { encodeTitleURI } from "../title.ts";
import { type BaseOptions, setDefaults } from "./options.ts";
import type { TargetedResponse } from "./targeted_response.ts";
import { createErrorResponse, createSuccessResponse } from "./utils.ts";
import type { FetchError } from "./robustFetch.ts";

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

  const params = new URLSearchParams([
    ["followRename", `${followRename ?? true}`],
    ...(projects?.map?.((id) => ["projects", id]) ?? []),
  ]);

  return new Request(
    `https://${hostName}/api/pages/${project}/${
      encodeTitleURI(title)
    }?${params}`,
    sid ? { headers: { Cookie: cookie(sid) } } : undefined,
  );
};

const getPage_fromResponse: GetPage["fromResponse"] = async (res) => {
  const response = ScrapboxResponse.from<Page, PageError>(res);

  if (response.status === 414) {
    return ScrapboxResponse.error({
      name: "TooLongURIError",
      message: "project ids may be too much.",
    });
  }

  await parseHTTPError(response, [
    "NotFoundError",
    "NotLoggedInError",
    "NotMemberError",
  ]);

  return response;
};

export interface GetPage {
  /** Build request for /api/pages/:project/:title
   *
   * @param project Project name to get page from
   * @param title Page title (case insensitive)
   * @param options Additional options
   * @return request
   */
  toRequest: (
    project: string,
    title: string,
    options?: GetPageOption,
  ) => Request;

  /** Get page JSON data from response
   *
   * @param res Response object
   * @return Page JSON data
   */
  fromResponse: (res: Response) => Promise<ScrapboxResponse<Page, PageError>>;

  (
    project: string,
    title: string,
    options?: GetPageOption,
  ): Promise<ScrapboxResponse<Page, PageError | FetchError>>;
}

export type PageError =
  | NotFoundError
  | NotLoggedInError
  | NotMemberError
  | TooLongURIError
  | HTTPError;

/** 指定したページのJSONデータを取得する
 *
 * @param project 取得したいページのproject名
 * @param title 取得したいページのtitle 大文字小文字は問わない
 * @param options オプション
 */
export const getPage: GetPage = /* @__PURE__ */ (() => {
  const fn: GetPage = async (
    project,
    title,
    options,
  ) => {
    const response = await setDefaults(options ?? {}).fetch(
      getPage_toRequest(project, title, options),
    );
    return getPage_fromResponse(response);
  };

  fn.toRequest = getPage_toRequest;
  fn.fromResponse = getPage_fromResponse;

  return fn;
})();

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
  /** Build request for /api/pages/:project
   *
   * @param project Project name to list pages from
   * @param options Additional options
   * @return request
   */
  toRequest: (
    project: string,
    options?: ListPagesOption,
  ) => Request;

  /** Get page list JSON data from response
   *
   * @param res Response object
   * @return Page list JSON data
   */
  fromResponse: (
    res: Response,
  ) => Promise<ScrapboxResponse<PageList, ListPagesError>>;

  (
    project: string,
    options?: ListPagesOption,
  ): Promise<ScrapboxResponse<PageList, ListPagesError | FetchError>>;
}

export type ListPagesError =
  | NotFoundError
  | NotLoggedInError
  | NotMemberError
  | HTTPError;

const listPages_toRequest: ListPages["toRequest"] = (project, options) => {
  const { sid, hostName, sort, limit, skip } = setDefaults(
    options ?? {},
  );
  const params = new URLSearchParams();
  if (sort !== undefined) params.append("sort", sort);
  if (limit !== undefined) params.append("limit", `${limit}`);
  if (skip !== undefined) params.append("skip", `${skip}`);

  return new Request(
    `https://${hostName}/api/pages/${project}?${params}`,
    sid ? { headers: { Cookie: cookie(sid) } } : undefined,
  );
};

const listPages_fromResponse: ListPages["fromResponse"] = async (res) => {
  const response = ScrapboxResponse.from<PageList, ListPagesError>(res);

  await parseHTTPError(response, [
    "NotFoundError",
    "NotLoggedInError",
    "NotMemberError",
  ]);

  return response;
};

/** 指定したprojectのページを一覧する
 *
 * @param project 一覧したいproject
 * @param options オプション 取得範囲や並び順を決める
 */
export const listPages: ListPages = /* @__PURE__ */ (() => {
  const fn: ListPages = async (
    project,
    options?,
  ) => {
    const response = await setDefaults(options ?? {})?.fetch(
      listPages_toRequest(project, options),
    );
    return listPages_fromResponse(response);
  };

  fn.toRequest = listPages_toRequest;
  fn.fromResponse = listPages_fromResponse;

  return fn;
})();
