import type {
  ErrorLike,
  NotFoundError,
  NotLoggedInError,
  NotMemberError,
  Page,
  PageList,
} from "@cosense/types/rest";
import { cookie } from "./auth.ts";
import { parseHTTPError } from "./parseHTTPError.ts";
import { encodeTitleURI } from "../title.ts";
import { type BaseOptions, setDefaults } from "./options.ts";
import {
  andThenAsyncForResult,
  mapAsyncForResult,
  mapErrAsyncForResult,
  type Result,
} from "option-t/plain_result";
import { unwrapOrForMaybe } from "option-t/maybe";
import { type HTTPError, responseIntoResult } from "./responseIntoResult.ts";
import type { FetchError } from "./robustFetch.ts";

/** Options for {@linkcode getPage} */
export interface GetPageOption extends BaseOptions {
  /** use `followRename` */
  followRename?: boolean;

  /** project ids to get External links */
  projects?: string[];
}

export interface TooLongURIError extends ErrorLike {
  name: "TooLongURIError";
}

const getPage_toRequest: GetPage["toRequest"] = (
  project,
  title,
  options,
) => {
  const { sid, hostName, followRename, projects } = setDefaults(options ?? {});

  const params = new URLSearchParams([
    ["followRename", `${followRename ?? true}`],
    ...(projects?.map?.((id) => ["projects", id]) ?? []),
  ]);

  return new Request(
    `https://${hostName}/api/pages/${project}/${
      encodeTitleURI(title)
    }?${params}`,
    sid ? { headers: { Cookie: cookie(sid) } } : undefined,
  );
};

const getPage_fromResponse: GetPage["fromResponse"] = async (res) =>
  mapErrAsyncForResult(
    await mapAsyncForResult(
      responseIntoResult(res),
      (res) => res.json() as Promise<Page>,
    ),
    async (
      error,
    ) => {
      if (error.response.status === 414) {
        return {
          name: "TooLongURIError",
          message: "project ids may be too much.",
        };
      }

      return unwrapOrForMaybe<PageError>(
        await parseHTTPError(error, [
          "NotFoundError",
          "NotLoggedInError",
          "NotMemberError",
        ]),
        error,
      );
    },
  );

export interface GetPage {
  /** Constructs a request for the `/api/pages/:project/:title` endpoint
   *
   * @param project The project name containing the desired page
   * @param title The page title to retrieve (case insensitive)
   * @param options - Additional configuration options
   * @returns A {@linkcode Request} object for fetching page data
   */
  toRequest: (
    project: string,
    title: string,
    options?: GetPageOption,
  ) => Request;

  /** Extracts page JSON data from the API response
   *
   * @param res - The response from the API
   * @returns A {@linkcode Result}<{@linkcode unknown}, {@linkcode Error}> containing:
   *          - Success: The page data in JSON format
   *          - Error: One of several possible errors:
   *            - {@linkcode NotFoundError}: Page not found
   *            - {@linkcode NotLoggedInError}: Authentication required
   *            - {@linkcode NotMemberError}: User lacks access
   *            - {@linkcode HTTPError}: Other HTTP errors
   */
  fromResponse: (res: Response) => Promise<Result<Page, PageError>>;

  (
    project: string,
    title: string,
    options?: GetPageOption,
  ): Promise<Result<Page, PageError | FetchError>>;
}

export type PageError =
  | NotFoundError
  | NotLoggedInError
  | NotMemberError
  | TooLongURIError
  | HTTPError;

/** Retrieves JSON data for a specified page
 *
 * @param project The project name containing the desired page
 * @param title The page title to retrieve (case insensitive)
 * @param options Additional configuration options for the request
 */
export const getPage: GetPage = /* @__PURE__ */ (() => {
  const fn: GetPage = async (
    project,
    title,
    options,
  ) =>
    andThenAsyncForResult<Response, Page, PageError | FetchError>(
      await setDefaults(options ?? {}).fetch(
        getPage_toRequest(project, title, options),
      ),
      (input) => getPage_fromResponse(input),
    );

  fn.toRequest = getPage_toRequest;
  fn.fromResponse = getPage_fromResponse;

  return fn;
})();

/** Options for {@linkcode listPages} */
export interface ListPagesOption extends BaseOptions {
  /** the sort of page list to return
   *
   * @default updated
   */
  sort?:
    | "updatedWithMe"
    | "updated"
    | "created"
    | "accessed"
    | "pageRank"
    | "linked"
    | "views"
    | "title";
  /** the index getting page list from
   *
   * @default 0
   */
  skip?: number;
  /** threshold of the length of page list
   *
   * @default 100
   */
  limit?: number;
}

export interface ListPages {
  /** Constructs a request for the `/api/pages/:project` endpoint
   *
   * @param project The project name to list pages from
   * @param options - Additional configuration options (sorting, pagination, etc.)
   * @returns A {@linkcode Request} object for fetching pages data
   */
  toRequest: (
    project: string,
    options?: ListPagesOption,
  ) => Request;

  /** Extracts page list JSON data from the API response
   *
   * @param res - The response from the API
   * @returns A {@linkcode Result}<{@linkcode Page[]}, {@linkcode ListPagesError}> containing:
   *          - Success: Array of page data in JSON format
   *          - Error: One of several possible errors:
   *            - {@linkcode NotLoggedInError}: Authentication required
   *            - {@linkcode NotMemberError}: User lacks access
   *            - {@linkcode HTTPError}: Other HTTP errors
   */
  fromResponse: (res: Response) => Promise<Result<PageList, ListPagesError>>;

  (
    project: string,
    options?: ListPagesOption,
  ): Promise<Result<PageList, ListPagesError | FetchError>>;
}

export type ListPagesError =
  | NotFoundError
  | NotLoggedInError
  | NotMemberError
  | HTTPError;

const listPages_toRequest: ListPages["toRequest"] = (project, options) => {
  const { sid, hostName, sort, limit, skip } = setDefaults(
    options ?? {},
  );
  const params = new URLSearchParams();
  if (sort !== undefined) params.append("sort", sort);
  if (limit !== undefined) params.append("limit", `${limit}`);
  if (skip !== undefined) params.append("skip", `${skip}`);

  return new Request(
    `https://${hostName}/api/pages/${project}?${params}`,
    sid ? { headers: { Cookie: cookie(sid) } } : undefined,
  );
};

const listPages_fromResponse: ListPages["fromResponse"] = async (res) =>
  mapErrAsyncForResult(
    await mapAsyncForResult(
      responseIntoResult(res),
      (res) => res.json() as Promise<PageList>,
    ),
    async (error) =>
      unwrapOrForMaybe<ListPagesError>(
        await parseHTTPError(error, [
          "NotFoundError",
          "NotLoggedInError",
          "NotMemberError",
        ]),
        error,
      ),
  );

/** Lists pages from a specified project
 *
 * @param project The project name to list pages from
 * @param options Configuration options for pagination and sorting
 */
export const listPages: ListPages = /* @__PURE__ */ (() => {
  const fn: ListPages = async (
    project,
    options?,
  ) =>
    andThenAsyncForResult<Response, PageList, ListPagesError | FetchError>(
      await setDefaults(options ?? {})?.fetch(
        listPages_toRequest(project, options),
      ),
      listPages_fromResponse,
    );

  fn.toRequest = listPages_toRequest;
  fn.fromResponse = listPages_fromResponse;

  return fn;
})();
