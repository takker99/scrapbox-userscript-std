import {
  isErr,
  mapAsyncForResult,
  mapErrAsyncForResult,
  type Result,
  unwrapOk,
} from "option-t/plain_result";
import type {
  NoQueryError,
  NotFoundError,
  NotLoggedInError,
  NotMemberError,
  ProjectSearchResult,
  SearchResult,
} from "@cosense/types/rest";
import { cookie } from "./auth.ts";
import { parseHTTPError } from "./parseHTTPError.ts";
import { type HTTPError, responseIntoResult } from "./responseIntoResult.ts";
import { type BaseOptions, setDefaults } from "./options.ts";
import type { FetchError } from "./mod.ts";

export type SearchForPagesError =
  | NotFoundError
  | NotMemberError
  | NotLoggedInError
  | NoQueryError
  | HTTPError;

/** search a project for pages
 *
 * @param query 検索語句
 * @param project 検索範囲とするprojectの名前
 * @param init connect.sid etc.
 */
export const searchForPages = async (
  query: string,
  project: string,
  init?: BaseOptions,
): Promise<Result<SearchResult, SearchForPagesError | FetchError>> => {
  const { sid, hostName, fetch } = setDefaults(init ?? {});

  const req = new Request(
    `https://${hostName}/api/pages/${project}/search/query?q=${
      encodeURIComponent(query)
    }`,
    sid ? { headers: { Cookie: cookie(sid) } } : undefined,
  );

  const res = await fetch(req);
  if (isErr(res)) return res;

  return mapAsyncForResult(
    await mapErrAsyncForResult(
      responseIntoResult(unwrapOk(res)),
      async (error) =>
        (await parseHTTPError(error, [
          "NotFoundError",
          "NotLoggedInError",
          "NotMemberError",
          "NoQueryError",
        ])) ?? error,
    ),
    (res) => res.json() as Promise<SearchResult>,
  );
};

export type SearchForJoinedProjectsError =
  | NotLoggedInError
  | NoQueryError
  | HTTPError;

/** search for joined projects
 *
 * @param query 検索語句
 * @param init connect.sid etc.
 */
export const searchForJoinedProjects = async (
  query: string,
  init?: BaseOptions,
): Promise<
  Result<
    ProjectSearchResult,
    SearchForJoinedProjectsError | FetchError
  >
> => {
  const { sid, hostName, fetch } = setDefaults(init ?? {});

  const req = new Request(
    `https://${hostName}/api/projects/search/query?q=${
      encodeURIComponent(query)
    }`,
    sid ? { headers: { Cookie: cookie(sid) } } : undefined,
  );

  const res = await fetch(req);
  if (isErr(res)) return res;

  return mapAsyncForResult(
    await mapErrAsyncForResult(
      responseIntoResult(unwrapOk(res)),
      async (error) =>
        (await parseHTTPError(error, [
          "NotLoggedInError",
          "NoQueryError",
        ])) ?? error,
    ),
    (res) => res.json() as Promise<ProjectSearchResult>,
  );
};

export type SearchForWatchListError = SearchForJoinedProjectsError;

/** search for watch list
 *
 * watch listと銘打っているが、実際には参加していないpublic projectならどれでも検索できる
 *
 * 参加しているprojectのidは指定しても無視されるだけ
 *
 * @param query 検索語句
 * @param projectIds 検索候補のprojectのidのリスト
 * @param init connect.sid etc.
 */
export const searchForWatchList = async (
  query: string,
  projectIds: string[],
  init?: BaseOptions,
): Promise<
  Result<
    ProjectSearchResult,
    SearchForWatchListError | FetchError
  >
> => {
  const { sid, hostName, fetch } = setDefaults(init ?? {});

  const params = new URLSearchParams([
    ["q", encodeURIComponent(query)],
    ...projectIds.map((projectId) => ["ids", projectId]),
  ]);

  const req = new Request(
    `https://${hostName}/api/projects/search/watch-list?${params}`,
    sid ? { headers: { Cookie: cookie(sid) } } : undefined,
  );

  const res = await fetch(req);
  if (isErr(res)) return res;

  return mapAsyncForResult(
    await mapErrAsyncForResult(
      responseIntoResult(unwrapOk(res)),
      async (error) =>
        (await parseHTTPError(error, [
          "NotLoggedInError",
          "NoQueryError",
        ])) ?? error,
    ),
    (res) => res.json() as Promise<ProjectSearchResult>,
  );
};
