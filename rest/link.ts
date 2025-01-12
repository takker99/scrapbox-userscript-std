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

/** Error that occurs when an invalid followingId is provided for pagination */
export interface InvalidFollowingIdError extends ErrorLike {
  name: "InvalidFollowingIdError";
}

export interface GetLinksOptions extends BaseOptions {
  /** ID indicating the next list of links */
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

/** Retrieve link data from a specified Scrapbox project
 *
 * This function fetches link data from a project, supporting pagination through
 * the {@linkcode GetLinksOptions.followingId} parameter. It returns both the link data and the next
 * followingId for subsequent requests.
 *
 * @param project The project to retrieve link data from
 * @param options Configuration options
 * @returns A {@linkcode Result} containing either:
 *          - Success: {@linkcode GetLinksResult} with pages and next followingId
 *          - Error: One of several possible errors:
 *            - {@linkcode NotFoundError}: Project not found
 *            - {@linkcode NotLoggedInError}: Authentication required
 *            - {@linkcode InvalidFollowingIdError}: Invalid pagination ID
 *            - {@linkcode HTTPError}: Network or server errors
 *
 * @example
 * ```typescript
 * import { isErr, unwrapErr, unwrapOk } from "option-t/plain_result";
 *
 * // Get first page of links
 * const result = await getLinks("project-name");
 * if (isErr(result)) {
 *   throw new Error(`Failed to get links: ${unwrapErr(result)}`);
 * }
 * const { pages, followingId } = unwrapOk(result);
 *
 * // Get next page if available
 * if (followingId) {
 *   const nextResult = await getLinks("project-name", { followingId });
 *   // Handle next page result...
 * }
 * ```
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

/** Retrieve all link data from a specified project in bulk
 *
 * This async generator yields arrays of link data, automatically handling
 * pagination. Each yield returns a batch of links as received from the API.
 *
 * @param project The project to retrieve link data from
 * @param options Configuration options
 * @returns An {@linkcode AsyncGenerator} that yields either:
 *          - Success: Array of {@linkcode SearchedTitle} objects (batch of links)
 *          - Error: Error if authentication fails or other issues occur
 *
 * @example
 * ```typescript
 * import { isErr, unwrapErr, unwrapOk } from "option-t/plain_result";
 *
 * for await (const result of readLinksBulk("project-name")) {
 *   if (isErr(result)) {
 *     throw new Error(`Failed to get links: ${unwrapErr(result)}`);
 *   }
 *   console.log(`Got ${unwrapOk(result).length} links`);
 * }
 * ```
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

/** Retrieve all link data from a specified project one by one
 *
 * This async generator yields individual link entries, automatically handling
 * pagination. Unlike {@linkcode readLinksBulk}, this yields one {@linkcode SearchedTitle} at a time,
 * making it ideal for processing links individually.
 *
 * @param project The project to retrieve link data from
 * @param options Configuration options
 * @returns An {@linkcode AsyncGenerator} that yields either:
 *          - Success: Individual {@linkcode SearchedTitle} object (single link)
 *          - Error: Error if authentication fails or other issues occur
 *
 * @example
 * ```typescript
 * import { isErr, unwrapErr, unwrapOk } from "option-t/plain_result";
 *
 * for await (const result of readLinks("project-name")) {
 *   if (isErr(result)) {
 *     throw new Error(`Failed to get link: ${unwrapErr(result)}`);
 *   }
 *   // Single link entry
 *   console.log("Processing link:", unwrapOk(result).title);
 * }
 * ```
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
