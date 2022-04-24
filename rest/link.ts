import type {
  ErrorLike,
  NotFoundError,
  NotLoggedInError,
  SearchedTitle,
} from "../deps/scrapbox-rest.ts";
import { cookie } from "./auth.ts";
import { UnexpectedResponseError } from "./error.ts";
import { tryToErrorLike } from "../is.ts";
import { BaseOptions, Result, setDefaults } from "./util.ts";

/** 不正なfollowingIdを渡されたときに発生するエラー */
export interface InvalidFollowingIdError extends ErrorLike {
  name: "InvalidFollowingIdError";
}

export interface GetLinksOptions extends BaseOptions {
  /** 次のリンクリストを示すID */
  followingId?: string;
}

/** 指定したprojectのリンクデータを取得する
 *
 * @param project データを取得したいproject
 */
export const getLinks = async (
  project: string,
  options?: GetLinksOptions,
): Promise<
  Result<{
    pages: SearchedTitle[];
    followingId: string;
  }, NotFoundError | NotLoggedInError | InvalidFollowingIdError>
> => {
  const { sid, hostName, fetch, followingId } = setDefaults(options ?? {});
  const path = `https://${hostName}/api/pages/${project}/search/titles${
    followingId ? `?followingId=${followingId}` : ""
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
          name: "InvalidFollowingIdError",
          message: await res.text(),
        },
      };
    }
    const text = await res.text();
    const value = tryToErrorLike(text);
    if (!value) {
      throw new UnexpectedResponseError({
        path: new URL(path),
        ...res,
        body: text,
      });
    }
    return { ok: false, value: value as NotFoundError | NotLoggedInError };
  }
  const pages = (await res.json()) as SearchedTitle[];
  return {
    ok: true,
    value: { pages, followingId: res.headers.get("X-following-id") ?? "" },
  };
};

/** 指定したprojectの全てのリンクデータを取得する
 *
 * responseで返ってきたリンクデータの塊ごとに返す
 *
 * @param project データを取得したいproject
 * @return 認証が通らなかったらエラーを、通ったらasync generatorを返す
 */
export const readLinksBulk = async (
  project: string,
  options?: BaseOptions,
): Promise<
  | NotFoundError
  | NotLoggedInError
  | InvalidFollowingIdError
  | AsyncGenerator<SearchedTitle[], void, unknown>
> => {
  const first = await getLinks(project, options);
  if (!first.ok) return first.value;

  return async function* () {
    yield first.value.pages;
    let followingId = first.value.followingId;

    while (followingId) {
      const result = await getLinks(project, { followingId, ...options });

      // すでに認証は通っているので、ここでエラーになるはずがない
      if (!result.ok) {
        throw new Error("The authorization cannot be unavailable");
      }
      yield result.value.pages;
      followingId = result.value.followingId;
    }
  }();
};

/** 指定したprojectの全てのリンクデータを取得し、一つづつ返す
 *
 * @param project データを取得したいproject
 * @return 認証が通らなかったらエラーを、通ったらasync generatorを返す
 */
export const readLinks = async (
  project: string,
  options?: BaseOptions,
): Promise<
  | NotFoundError
  | NotLoggedInError
  | InvalidFollowingIdError
  | AsyncGenerator<SearchedTitle, void, unknown>
> => {
  const reader = await readLinksBulk(project, options);
  if ("name" in reader) return reader;

  return async function* () {
    for await (const titles of reader) {
      for (const title of titles) {
        yield title;
      }
    }
  }();
};
