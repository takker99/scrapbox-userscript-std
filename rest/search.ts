import {
  isErr,
  mapAsyncForResult,
  mapErrAsyncForResult,
  Result,
  unwrapOk,
} from "../deps/option-t.ts";
import type {
  NoQueryError,
  NotFoundError,
  NotLoggedInError,
  NotMemberError,
  ProjectSearchResult,
  SearchResult,
} from "../deps/scrapbox-rest.ts";
import { cookie } from "./auth.ts";
import { parseHTTPError } from "./parseHTTPError.ts";
import { HTTPError, responseIntoResult } from "./responseIntoResult.ts";
import { AbortError, NetworkError } from "./robustFetch.ts";
import { BaseOptions, setDefaults } from "./util.ts";

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
  Result<
    SearchResult,
    | NotFoundError
    | NotMemberError
    | NotLoggedInError
    | NoQueryError
    | NetworkError
    | AbortError
    | HTTPError
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
    NotLoggedInError | NoQueryError | NetworkError | AbortError | HTTPError
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
    NotLoggedInError | NoQueryError | NetworkError | AbortError | HTTPError
  >
> => {
  const { sid, hostName, fetch } = setDefaults(init ?? {});

  const params = new URLSearchParams();
  params.append("q", encodeURIComponent(query));
  for (const projectId of projectIds) {
    params.append("ids", projectId);
  }

  const req = new Request(
    `https://${hostName}/api/projects/search/watch-list?${params.toString()}`,
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
