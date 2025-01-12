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

/** Search for pages within a specific project
 *
 * @param query The search query string to match against pages
 * @param project The name of the project to search within
 * @param init Options including `connect.sid` (session ID) and other configuration
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

/** Search across all projects that the user has joined
 *
 * @param query The search query string to match against projects
 * @param init Options including `connect.sid` (session ID) and other configuration
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

/** Search within a list of watched projects
 *
 * > [!NOTE]
 * > Despite the name "watch list", this function can search any public project,
 * > even those the user hasn't joined.
 *
 * > [!NOTE]
 * > If you include IDs of projects the user has already joined,
 * > these IDs will be ignored in the search.
 *
 * @param query The search query string to match
 * @param projectIds List of project IDs to search within (for non-joined public projects)
 * @param init Options including `connect.sid` (session ID) and other configuration
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
