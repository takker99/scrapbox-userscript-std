import {
  createOk,
  isErr,
  mapAsyncForResult,
  mapErrAsyncForResult,
  type Result,
  unwrapOk,
} from "option-t/plain_result";
import type {
  ErrorLike,
  NotFoundError,
  NotLoggedInError,
  SearchedTitle,
} from "@cosense/types/rest";
import { cookie } from "./auth.ts";
import { parseHTTPError } from "./parseHTTPError.ts";
import { type HTTPError, responseIntoResult } from "./responseIntoResult.ts";
import { type BaseOptions, setDefaults } from "./options.ts";
import type { FetchError } from "./mod.ts";

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

export type LinksError =
  | NotFoundError
  | NotLoggedInError
  | InvalidFollowingIdError
  | HTTPError;

/** Get the links of the specified project
 *
 * @param project The project to get the data from
 * @param options Options for the request
 * @return a promise that resolves to the parsed data
 */
export interface GetLinks {
  (
    project: string,
    options?: GetLinksOptions,
  ): Promise<Result<GetLinksResult, LinksError | FetchError>>;

  /** Create a request to `GET /api/pages/:project/search/titles`
   *
   * @param project The project to get the data from
   * @param options Options for the request
   * @return The request object
   */
  toRequest: (project: string, options?: GetLinksOptions) => Request;

  /** Parse the response from `GET /api/pages/:project/search/titles`
   *
   * @param response The response object
   * @return a promise that resolves to the parsed data
   */
  fromResponse: (
    response: Response,
  ) => Promise<Result<GetLinksResult, LinksError>>;
}

const getLinks_toRequest: GetLinks["toRequest"] = (project, options) => {
  const { sid, hostName, followingId } = setDefaults(options ?? {});

  return new Request(
    `https://${hostName}/api/pages/${project}/search/titles${
      followingId ? `?followingId=${followingId}` : ""
    }`,
    sid ? { headers: { Cookie: cookie(sid) } } : undefined,
  );
};

const getLinks_fromResponse: GetLinks["fromResponse"] = async (response) =>
  mapAsyncForResult(
    await mapErrAsyncForResult(
      responseIntoResult(response),
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

/** 指定したprojectのリンクデータを取得する
 *
 * @param project データを取得したいproject
 */
export const getLinks: GetLinks = /* @__PURE__ */ (() => {
  const fn: GetLinks = async (project, options) => {
    const res = await setDefaults(options ?? {}).fetch(
      getLinks_toRequest(project, options),
    );
    if (isErr(res)) return res;
    return getLinks_fromResponse(unwrapOk(res));
  };

  fn.toRequest = getLinks_toRequest;
  fn.fromResponse = getLinks_fromResponse;
  return fn;
})();

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
  Result<SearchedTitle[], LinksError | FetchError>,
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
  Result<SearchedTitle, LinksError | FetchError>,
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
