import type {
  ErrorLike,
  NotFoundError,
  NotLoggedInError,
  SearchedTitle,
} from "@cosense/types/rest";
import { cookie } from "./auth.ts";
import { parseHTTPError } from "./parseHTTPError.ts";
import type { TargetedResponse } from "./targeted_response.ts";
import { createErrorResponse as _createErrorResponse, createSuccessResponse as _createSuccessResponse } from "./utils.ts";
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
  ): Promise<ScrapboxResponse<GetLinksResult, LinksError | FetchError>>;

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
  ) => Promise<ScrapboxResponse<GetLinksResult, LinksError>>;
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

const getLinks_fromResponse: GetLinks["fromResponse"] = async (response) => {
  const res = ScrapboxResponse.from<GetLinksResult, LinksError>(response);

  if (res.status === 422) {
    return ScrapboxResponse.error({
      name: "InvalidFollowingIdError",
      message: await response.text(),
    } as InvalidFollowingIdError);
  }

  await parseHTTPError(res, [
    "NotFoundError",
    "NotLoggedInError",
  ]);

  const pages = await res.json() as SearchedTitle[];
  return ScrapboxResponse.ok({
    pages,
    followingId: response.headers.get("X-following-id") ?? "",
  });
};

/** 指定したprojectのリンクデータを取得する
 *
 * @param project データを取得したいproject
 */
export const getLinks: GetLinks = /* @__PURE__ */ (() => {
  const fn: GetLinks = async (project, options) => {
    const response = await setDefaults(options ?? {}).fetch(
      getLinks_toRequest(project, options),
    );
    return getLinks_fromResponse(response);
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
  ScrapboxResponse<SearchedTitle[], LinksError | FetchError>,
  void,
  unknown
> {
  let followingId: string | undefined;
  do {
    const result = await getLinks(project, { followingId, ...options });
    if (!result.ok) {
      yield result;
      return;
    }

    yield ScrapboxResponse.ok(result.data.pages);
    followingId = result.data.followingId;
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
  ScrapboxResponse<SearchedTitle, LinksError | FetchError>,
  void,
  unknown
> {
  for await (const result of readLinksBulk(project, options)) {
    if (!result.ok) {
      yield result;
      return;
    }
    for (const page of result.data) {
      yield ScrapboxResponse.ok(page);
    }
  }
}
