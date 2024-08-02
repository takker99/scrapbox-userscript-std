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
import { type BaseOptions, setDefaults } from "./util.ts";
import {
  andThenAsyncForResult,
  mapAsyncForResult,
  mapErrAsyncForResult,
  type Result,
} from "option-t/plain_result";
import { unwrapOrForMaybe } from "option-t/maybe";
import { type HTTPError, responseIntoResult } from "./responseIntoResult.ts";
import type { AbortError, NetworkError } from "./robustFetch.ts";

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

  return new Request(
    `https://${hostName}/api/pages/${project}/${
      encodeTitleURI(title)
    }?${params}`,
    sid ? { headers: { Cookie: cookie(sid) } } : undefined,
  );
};

const getPage_fromResponse: GetPage["fromResponse"] = async (res) =>
  mapErrAsyncForResult(
    await mapAsyncForResult(
      responseIntoResult(res),
      (res) => res.json() as Promise<Page>,
    ),
    async (
      error,
    ) => {
      if (error.response.status === 414) {
        return {
          name: "TooLongURIError",
          message: "project ids may be too much.",
        };
      }

      return unwrapOrForMaybe<
        NotFoundError | NotLoggedInError | NotMemberError | HTTPError
      >(
        await parseHTTPError(error, [
          "NotFoundError",
          "NotLoggedInError",
          "NotMemberError",
        ]),
        error,
      );
    },
  );

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
      | NotFoundError
      | NotLoggedInError
      | NotMemberError
      | TooLongURIError
      | HTTPError
    >
  >;

  (project: string, title: string, options?: GetPageOption): Promise<
    Result<
      Page,
      | NotFoundError
      | NotLoggedInError
      | NotMemberError
      | TooLongURIError
      | HTTPError
      | NetworkError
      | AbortError
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
) =>
  andThenAsyncForResult<
    Response,
    Page,
    | NotFoundError
    | NotLoggedInError
    | NotMemberError
    | TooLongURIError
    | HTTPError
    | NetworkError
    | AbortError
  >(
    await setDefaults(options ?? {}).fetch(
      getPage_toRequest(project, title, options),
    ),
    (input) => getPage_fromResponse(input),
  );

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
      NotFoundError | NotLoggedInError | NotMemberError | HTTPError
    >
  >;

  (project: string, options?: ListPagesOption): Promise<
    Result<
      PageList,
      | NotFoundError
      | NotLoggedInError
      | NotMemberError
      | NetworkError
      | AbortError
      | HTTPError
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

  return new Request(
    `https://${hostName}/api/pages/${project}?${params}`,
    sid ? { headers: { Cookie: cookie(sid) } } : undefined,
  );
};

const listPages_fromResponse: ListPages["fromResponse"] = async (res) =>
  mapErrAsyncForResult(
    await mapAsyncForResult(
      responseIntoResult(res),
      (res) => res.json() as Promise<PageList>,
    ),
    async (error) =>
      unwrapOrForMaybe<
        NotFoundError | NotLoggedInError | NotMemberError | HTTPError
      >(
        await parseHTTPError(error, [
          "NotFoundError",
          "NotLoggedInError",
          "NotMemberError",
        ]),
        error,
      ),
  );

/** 指定したprojectのページを一覧する
 *
 * @param project 一覧したいproject
 * @param options オプション 取得範囲や並び順を決める
 */
export const listPages: ListPages = async (
  project,
  options?,
) =>
  andThenAsyncForResult<
    Response,
    PageList,
    | NotFoundError
    | NotLoggedInError
    | NotMemberError
    | NetworkError
    | AbortError
    | HTTPError
  >(
    await setDefaults(options ?? {})?.fetch(
      listPages_toRequest(project, options),
    ),
    listPages_fromResponse,
  );

listPages.toRequest = listPages_toRequest;
listPages.fromResponse = listPages_fromResponse;
