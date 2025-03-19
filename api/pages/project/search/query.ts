import type {
  NotFoundError,
  NotLoggedInError,
  NotMemberError,
  SearchResult,
} from "@cosense/types/rest";
import type { ResponseOfEndpoint } from "../../../../targeted_response.ts";
import { type BaseOptions, setDefaults } from "../../../../util.ts";
import { cookie } from "../../../../rest/auth.ts";

/** Constructs a request for the `/api/pages/:project/search/query` endpoint
 *
 * @param project The name of the project to search within
 * @param query The search query string to match against pages
 * @param options - Additional configuration options
 * @returns A {@linkcode Request} object for fetching page data
 */
export const makeGetRequest = <R extends Response | undefined>(
  project: string,
  query: string,
  options?: BaseOptions<R>,
): Request => {
  const { sid, hostName } = setDefaults(options ?? {});

  return new Request(
    `https://${hostName}/api/pages/${project}/search/query?q=${
      encodeURIComponent(query)
    }`,
    sid ? { headers: { Cookie: cookie(sid) } } : undefined,
  );
};

/** Search for pages within a specific project
 *
 * @param project The name of the project to search within
 * @param query The search query string to match against pages
 * @param options Additional configuration options for the request
 * @returns A {@linkcode Response} object containing the search results
 */
export const get = <R extends Response | undefined = Response>(
  project: string,
  query: string,
  options?: BaseOptions<R>,
): Promise<
  ResponseOfEndpoint<{
    200: SearchResult;
    404: NotFoundError;
    401: NotLoggedInError;
    403: NotMemberError;
    422: { message: string };
  }, R>
> =>
  setDefaults(options ?? {}).fetch(
    makeGetRequest(project, query, options),
  ) as Promise<
    ResponseOfEndpoint<{
      200: SearchResult;
      404: NotFoundError;
      401: NotLoggedInError;
      403: NotMemberError;
      422: { message: string };
    }, R>
  >;
