import type {
  CommitsResponse,
  NotFoundError,
  NotLoggedInError,
  NotMemberError,
} from "@cosense/types/rest";
import type { ResponseOfEndpoint } from "../../../targeted_response.ts";
import { type BaseOptions, setDefaults } from "../../../util.ts";
import { cookie } from "../../../rest/auth.ts";

/**
 * Represents an error when the commit HEAD is invalid.
 */
export interface InvalidHeadError {
  /** error message */
  message: string;
}

/**
 * Options for {@linkcode getCommits}
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 */
export interface GetCommitsOption<R extends Response | undefined>
  extends BaseOptions<R> {
  /** Returns only the commits before the specified commit id.
   *
   * If not specified, returned all commits.
   */
  head?: string;
}

/** Constructs a request for the `/api/commits/:project/:pageId` endpoint
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @param project The project name containing the desired page
 * @param pageId The page ID to retrieve
 * @param options - Additional configuration options
 * @returns A {@linkcode Request} object for fetching page data
 */
export const makeGetCommitsRequest = <R extends Response | undefined>(
  project: string,
  pageId: string,
  options?: GetCommitsOption<R>,
): Request => {
  const { sid, baseURL, head } = setDefaults(options ?? {});

  return new Request(
    `${baseURL}api/commits/${project}/${pageId}?head=${head ?? ""}`,
    sid ? { headers: { Cookie: cookie(sid) } } : undefined,
  );
};

/** Retrieves the commit history for a specified page
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @param project The project name containing the desired page
 * @param pageId The page ID to retrieve
 * @param options Additional configuration options for the request
 */
export const getCommits = <R extends Response | undefined = Response>(
  project: string,
  pageId: string,
  options?: GetCommitsOption<R>,
): Promise<
  ResponseOfEndpoint<{
    200: CommitsResponse;
    400: InvalidHeadError;
    401: NotLoggedInError;
    403: NotMemberError;
    404: NotFoundError;
  }, R>
> =>
  setDefaults(options ?? {}).fetch(
    makeGetCommitsRequest(project, pageId, options),
  ) as Promise<
    ResponseOfEndpoint<{
      200: CommitsResponse;
      400: InvalidHeadError;
      401: NotLoggedInError;
      403: NotMemberError;
      404: NotFoundError;
    }, R>
  >;
