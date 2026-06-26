import type {
  NotFoundError,
  NotLoggedInError,
  NotMemberError,
  SearchedTitle,
} from "@cosense/types/rest";
import type { ResponseOfEndpoint } from "../../../../targeted_response.ts";
import { type BaseOptions, setDefaults } from "../../../../util.ts";
import { cookie } from "../../../../rest/auth.ts";

/**
 * Options for {@linkcode getLinks}
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 */
export interface GetLinksOptions<R extends Response | undefined>
  extends BaseOptions<R> {
  /** ID indicating the next list of links */
  followingId?: string;
}

/** Create a request to `GET /api/pages/:project/search/titles`
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @param project The project to get the links from
 * @param options - Additional configuration options
 * @returns A {@linkcode Request} object for fetching link data
 */
export const makeGetLinksRequest = <R extends Response | undefined>(
  project: string,
  options?: GetLinksOptions<R>,
): Request => {
  const { sid, baseURL, followingId } = setDefaults(options ?? {});

  return new Request(
    `${baseURL}api/pages/${project}/search/titles${
      followingId ? `?followingId=${followingId}` : ""
    }`,
    sid ? { headers: { Cookie: cookie(sid) } } : undefined,
  );
};

/** Retrieve link data from a specified Scrapbox project
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * This function fetches link data from a project, supporting pagination through
 * the {@linkcode GetLinksOptions.followingId} parameter. It returns both the link data and the next
 * followingId for subsequent requests.
 *
 * @param project The project to retrieve link data from
 * @param options Additional configuration options for the request
 * @returns A {@linkcode Response} object containing the link data
 */
export const getLinks = <R extends Response | undefined = Response>(
  project: string,
  options?: GetLinksOptions<R>,
): Promise<
  ResponseOfEndpoint<{
    200: SearchedTitle[];
    404: NotFoundError;
    401: NotLoggedInError;
    403: NotMemberError;
    422: { message: string };
  }, R>
> =>
  setDefaults(options ?? {}).fetch(
    makeGetLinksRequest(project, options),
  ) as Promise<
    ResponseOfEndpoint<{
      200: SearchedTitle[];
      404: NotFoundError;
      401: NotLoggedInError;
      403: NotMemberError;
      422: { message: string };
    }, R>
  >;

/** @deprecated Use {@link import("../../../../unstable-procedure/get-links-stream.ts").getLinksStream} instead */
export { getLinksStream } from "../../../../unstable-procedure/get-links-stream.ts";
