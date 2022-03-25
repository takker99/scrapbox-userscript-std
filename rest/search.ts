import type {
  NoQueryError,
  NotFoundError,
  NotLoggedInError,
  NotMemberError,
  ProjectSearchResult,
  SearchResult,
} from "../deps/scrapbox.ts";
import { cookie } from "./auth.ts";
import { UnexpectedResponseError } from "./error.ts";
import { tryToErrorLike } from "../is.ts";
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

  const path = `https://${hostName}/api/pages/${project}/search/query?q=${
    encodeURIComponent(query)
  }`;
  const res = await fetch(
    path,
    sid ? { headers: { Cookie: cookie(sid) } } : undefined,
  );

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
    const text = await res.json();
    const value = tryToErrorLike(text);
    if (!value) {
      throw new UnexpectedResponseError({
        path: new URL(path),
        ...res,
        body: await res.text(),
      });
    }
    return {
      ok: false,
      value: value as NotFoundError | NotMemberError | NotLoggedInError,
    };
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

  const path = `https://${hostName}/api/projects/search/query?q=${
    encodeURIComponent(query)
  }`;
  const res = await fetch(
    path,
    sid ? { headers: { Cookie: cookie(sid) } } : undefined,
  );

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
    const text = await res.json();
    const value = tryToErrorLike(text);
    if (!value) {
      throw new UnexpectedResponseError({
        path: new URL(path),
        ...res,
        body: await res.text(),
      });
    }
    return { ok: false, value: value as NotLoggedInError };
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

  const path =
    `https://${hostName}/api/projects/search/watch-list?${params.toString()}`;
  const res = await fetch(
    path,
    sid ? { headers: { Cookie: cookie(sid) } } : undefined,
  );

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
    const text = await res.json();
    const value = tryToErrorLike(text);
    if (!value) {
      throw new UnexpectedResponseError({
        path: new URL(path),
        ...res,
        body: await res.text(),
      });
    }
    return { ok: false, value: value as NotLoggedInError };
  }

  const value = (await res.json()) as ProjectSearchResult;
  return { ok: true, value };
};
