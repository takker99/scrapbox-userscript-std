import type {
  NotFoundError,
  NotLoggedInError,
  NotMemberError,
  PageList,
  PageSummary,
} from "@cosense/types/rest";
import { type BaseOptions, setDefaults } from "../../util.ts";
import { cookie } from "../../rest/auth.ts";
import type {
  ResponseOfEndpoint,
  TargetedResponse,
} from "../../targeted_response.ts";
import {
  type HTTPError,
  makeError,
  makeHTTPError,
  type TypedError,
} from "../../error.ts";
import { pooledMap } from "@std/async/pool";
import { range } from "@core/iterutil/range";
import { flatten } from "@core/iterutil/async/flatten";

/** Options for {@linkcode listPages}
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 */
export interface ListPagesOption<R extends Response | undefined>
  extends BaseOptions<R> {
  /** the sort of page list to return
   *
   * @default {"updated"}
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
   * @default {0}
   */
  skip?: number;

  /** threshold of the length of page list
   *
   * @default {100}
   */
  limit?: number;

  /**
   * The title of an icon to filter the page list by
   */
  filterValue?: string;
}

/** Constructs a request for the `/api/pages/:project` endpoint
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @param project The project name to list pages from
 * @param options - Additional configuration options (sorting, pagination, etc.)
 * @returns A {@linkcode Request} object for fetching pages data
 */
export const makeGetRequest = <R extends Response | undefined>(
  project: string,
  options?: ListPagesOption<R>,
): Request => {
  const { sid, baseURL, sort, limit, skip, filterValue } = setDefaults(
    options ?? {},
  );
  const params = new URLSearchParams();
  if (sort !== undefined) params.append("sort", sort);
  if (limit !== undefined) params.append("limit", `${limit}`);
  if (skip !== undefined) params.append("skip", `${skip}`);
  if (filterValue) {
    params.append("filterType", "icon");
    params.append("filterValue", filterValue);
  }

  return new Request(
    `${baseURL}api/pages/${project}?${params}`,
    sid ? { headers: { Cookie: cookie(sid) } } : undefined,
  );
};

/** Lists pages from a specified project
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @param project The project name to list pages from
 * @param options Configuration options for pagination and sorting
 * @returns A {@linkcode Result}<{@linkcode unknown}, {@linkcode Error}> containing:
 *          - Success: The page data in JSON format
 *          - Error: One of several possible errors:
 *            - {@linkcode NotFoundError}: Page not found
 *            - {@linkcode NotLoggedInError}: Authentication required
 *            - {@linkcode NotMemberError}: User lacks access
 */
export const listPages = <R extends Response | undefined = Response>(
  project: string,
  options?: ListPagesOption<R>,
): Promise<
  ResponseOfEndpoint<{
    200: PageList;
    404: NotFoundError;
    401: NotLoggedInError;
    403: NotMemberError;
  }, R>
> =>
  setDefaults(options ?? {}).fetch(
    makeGetRequest(project, options),
  ) as Promise<
    ResponseOfEndpoint<{
      200: PageList;
      404: NotFoundError;
      401: NotLoggedInError;
      403: NotMemberError;
    }, R>
  >;

/**
 * Options for {@linkcode listPagesStream}
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 */
export interface ListPagesStreamOption<R extends Response | undefined>
  extends ListPagesOption<R> {
  /** The number of requests to make concurrently
   *
   * @default {3}
   */
  poolLimit?: number;
}

/**
 * Lists pages from a given `project` with pagination
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @param project The project name to list pages from
 * @param options Configuration options for pagination and sorting
 * @throws {HTTPError | TypedError<"NotLoggedInError" | "NotMemberError" | "NotFoundError">} If any requests in the pagination sequence fail
 */
export async function* listPagesStream(
  project: string,
  options?: ListPagesStreamOption<Response>,
): AsyncGenerator<PageSummary, void, unknown> {
  const props = {
    ...(options ?? {}),
    skip: options?.skip ?? 0,
    limit: options?.limit ?? 100,
  };
  const response = await ensureResponse(await listPages(project, props));
  const list = await response.json();
  yield* list.pages;

  const limit = list.limit;
  const skip = list.skip + limit;
  const times = Math.ceil((list.count - skip) / limit);

  yield* flatten(
    pooledMap(
      options?.poolLimit ?? 3,
      range(0, times - 1),
      async (i) => {
        const response = await ensureResponse(
          await listPages(project, { ...props, skip: skip + i * limit, limit }),
        );
        const list = await response.json();
        return list.pages;
      },
    ),
  );
}

const ensureResponse = async (
  response: ResponseOfEndpoint<{
    200: PageList;
    404: NotFoundError;
    401: NotLoggedInError;
    403: NotMemberError;
  }, Response>,
): Promise<TargetedResponse<200, PageList>> => {
  switch (response.status) {
    case 200:
      return response;
    case 401:
    case 403:
    case 404: {
      const error = await response.json();
      throw makeError(error.name, error.message) satisfies TypedError<
        "NotLoggedInError" | "NotMemberError" | "NotFoundError"
      >;
    }
    default:
      throw makeHTTPError(response) satisfies HTTPError;
  }
};

export * from "./project/replace.ts";
export * from "./project/search.ts";
export * from "./project/title.ts";
