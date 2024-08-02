import {
  createOk,
  isErr,
  mapAsyncForResult,
  mapErrAsyncForResult,
  type Result,
  unwrapOk,
} from "../deps/option-t.ts";
import type {
  ErrorLike,
  NotFoundError,
  NotLoggedInError,
  SearchedTitle,
} from "../deps/scrapbox-rest.ts";
import { cookie } from "./auth.ts";
import { parseHTTPError } from "./parseHTTPError.ts";
import { type HTTPError, responseIntoResult } from "./responseIntoResult.ts";
import type { AbortError, NetworkError } from "./robustFetch.ts";
import { type BaseOptions, setDefaults } from "./util.ts";

/** 不正なfollowingIdを渡されたときに発生するエラー */
export interface InvalidFollowingIdError extends ErrorLike {
  name: "InvalidFollowingIdError";
}

export interface GetLinksOptions extends BaseOptions {
  /** 次のリンクリストを示すID */
  followingId?: string;
}

export interface GetLinksResult {
  pages: SearchedTitle[];
  followingId: string;
}

/** 指定したprojectのリンクデータを取得する
 *
 * @param project データを取得したいproject
 */
export const getLinks = async (
  project: string,
  options?: GetLinksOptions,
): Promise<
  Result<
    GetLinksResult,
    | NotFoundError
    | NotLoggedInError
    | InvalidFollowingIdError
    | NetworkError
    | AbortError
    | HTTPError
  >
> => {
  const { sid, hostName, fetch, followingId } = setDefaults(options ?? {});

  const req = new Request(
    `https://${hostName}/api/pages/${project}/search/titles${
      followingId ? `?followingId=${followingId}` : ""
    }`,
    sid ? { headers: { Cookie: cookie(sid) } } : undefined,
  );

  const res = await fetch(req);
  if (isErr(res)) return res;

  return mapAsyncForResult(
    await mapErrAsyncForResult(
      responseIntoResult(unwrapOk(res)),
      async (error) =>
        error.response.status === 422
          ? {
            name: "InvalidFollowingIdError",
            message: await error.response.text(),
          } as InvalidFollowingIdError
          : (await parseHTTPError(error, [
            "NotFoundError",
            "NotLoggedInError",
          ])) ?? error,
    ),
    (res) =>
      res.json().then((pages: SearchedTitle[]) => ({
        pages,
        followingId: res.headers.get("X-following-id") ?? "",
      })),
  );
};

/** 指定したprojectの全てのリンクデータを取得する
 *
 * responseで返ってきたリンクデータの塊ごとに返す
 *
 * @param project データを取得したいproject
 * @return 認証が通らなかったらエラーを、通ったらasync generatorを返す
 */
export async function* readLinksBulk(
  project: string,
  options?: BaseOptions,
): AsyncGenerator<
  Result<
    SearchedTitle[],
    | NotFoundError
    | NotLoggedInError
    | InvalidFollowingIdError
    | NetworkError
    | AbortError
    | HTTPError
  >,
  void,
  unknown
> {
  let followingId: string | undefined;
  do {
    const result = await getLinks(project, { followingId, ...options });
    if (isErr(result)) {
      yield result;
      return;
    }
    const res = unwrapOk(result);

    yield createOk(res.pages);
    followingId = res.followingId;
  } while (followingId);
}

/** 指定したprojectの全てのリンクデータを取得し、一つづつ返す
 *
 * @param project データを取得したいproject
 * @return 認証が通らなかったらエラーを、通ったらasync generatorを返す
 */
export async function* readLinks(
  project: string,
  options?: BaseOptions,
): AsyncGenerator<
  Result<
    SearchedTitle,
    | NotFoundError
    | NotLoggedInError
    | InvalidFollowingIdError
    | NetworkError
    | AbortError
    | HTTPError
  >,
  void,
  unknown
> {
  for await (const result of readLinksBulk(project, options)) {
    if (isErr(result)) {
      yield result;
      return;
    }
    for (const page of unwrapOk(result)) {
      yield createOk(page);
    }
  }
}
