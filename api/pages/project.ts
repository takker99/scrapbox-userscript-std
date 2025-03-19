import type {
  BasePage,
  NotFoundError,
  NotLoggedInError,
  NotMemberError,
  PageList,
} from "@cosense/types/rest";
import { type BaseOptions, setDefaults } from "../../util.ts";
import { cookie } from "../../rest/auth.ts";
import type { ResponseOfEndpoint } from "../../targeted_response.ts";
import {
  type HTTPError,
  makeError,
  makeHTTPError,
  type TypedError,
} from "../../error.ts";

/** Options for {@linkcode listPages} */
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
}

/** Constructs a request for the `/api/pages/:project` endpoint
 *
 * @param project The project name to list pages from
 * @param options - Additional configuration options (sorting, pagination, etc.)
 * @returns A {@linkcode Request} object for fetching pages data
 */
export const makeGetRequest = <R extends Response | undefined>(
  project: string,
  options?: ListPagesOption<R>,
): Request => {
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

/** Lists pages from a specified project
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
export const get = <R extends Response | undefined = Response>(
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
 * Lists pages from a given `project` with pagination
 *
 * @param project The project name to list pages from
 * @param options Configuration options for pagination and sorting
 * @throws {HTTPError | TypedError<"NotLoggedInError" | "NotMemberError" | "NotFoundError">} If any requests in the pagination sequence fail
 */
export async function* list(
  project: string,
  options?: ListPagesOption<Response>,
): AsyncGenerator<BasePage, void, unknown> {
  const props = { ...(options ?? {}), skip: options?.skip ?? 0 };
  while (true) {
    const response = await get(project, props);
    switch (response.status) {
      case 200:
        break;
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
    const list = await response.json();
    yield* list.pages;
    props.skip += props.limit ?? 100;
    if (list.skip + list.limit >= list.count) break;
  }
}

export * as title from "./project/title.ts";
export * as replace from "./project/replace.ts";
