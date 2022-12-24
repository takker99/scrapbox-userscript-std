import type {
  NoQueryError,
  NotFoundError,
  NotLoggedInError,
  NotMemberError,
  ProjectSearchResult,
  SearchResult,
} from "../deps/scrapbox-rest.ts";
import { cookie } from "./auth.ts";
import { makeError } from "./error.ts";
import { BaseOptions, Result, setDefaults } from "./util.ts";

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
    NotFoundError | NotMemberError | NotLoggedInError | NoQueryError
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

  if (!res.ok) {
    if (res.status === 422) {
      return {
        ok: false,
        value: {
          name: "NoQueryError",
          message: (await res.json()).message,
        },
      };
    }
    return makeError<NotFoundError | NotLoggedInError | NotMemberError>(
      req,
      res,
    );
  }

  const value = (await res.json()) as SearchResult;
  return { ok: true, value };
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
    NotLoggedInError | NoQueryError
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

  if (!res.ok) {
    if (res.status === 422) {
      return {
        ok: false,
        value: {
          name: "NoQueryError",
          message: (await res.json()).message,
        },
      };
    }
    return makeError<NotLoggedInError>(req, res);
  }

  const value = (await res.json()) as ProjectSearchResult;
  return { ok: true, value };
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
    NotLoggedInError | NoQueryError
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

  if (!res.ok) {
    if (res.status === 422) {
      return {
        ok: false,
        value: {
          // 本当はproject idが不正なときも422 errorになる
          name: "NoQueryError",
          message: (await res.json()).message,
        },
      };
    }
    return makeError<NotLoggedInError>(req, res);
  }

  const value = (await res.json()) as ProjectSearchResult;
  return { ok: true, value };
};
