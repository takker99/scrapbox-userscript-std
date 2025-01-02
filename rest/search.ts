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
import type { TargetedResponse } from "./targeted_response.ts";
import {
  createErrorResponse,
  createSuccessResponse,
  createTargetedResponse,
} from "./utils.ts";
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
): Promise<
  TargetedResponse<
    200 | 400 | 404,
    SearchResult | SearchForPagesError | FetchError
  >
> => {
  const { sid, hostName, fetch } = setDefaults(init ?? {});

  const req = new Request(
    `https://${hostName}/api/pages/${project}/search/query?q=${
      encodeURIComponent(query)
    }`,
    sid ? { headers: { Cookie: cookie(sid) } } : undefined,
  );

  const res = await fetch(req);
  const response = createTargetedResponse<
    200 | 400 | 404,
    SearchResult | SearchForPagesError
  >(res);

  await parseHTTPError(response, [
    "NotFoundError",
    "NotLoggedInError",
    "NotMemberError",
    "NoQueryError",
  ]);

  return response;
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
  TargetedResponse<
    200 | 400 | 404,
    ProjectSearchResult | SearchForJoinedProjectsError | FetchError
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
  const response = createTargetedResponse<
    200 | 400 | 404,
    ProjectSearchResult | SearchForJoinedProjectsError
  >(res);

  await parseHTTPError(response, [
    "NotLoggedInError",
    "NoQueryError",
  ]);

  return response;
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
  TargetedResponse<
    200 | 400 | 404,
    ProjectSearchResult | SearchForWatchListError | FetchError
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
  const response = createTargetedResponse<
    200 | 400 | 404,
    ProjectSearchResult | SearchForWatchListError
  >(res);

  await parseHTTPError(response, [
    "NotLoggedInError",
    "NoQueryError",
  ]);

  return response;
};
