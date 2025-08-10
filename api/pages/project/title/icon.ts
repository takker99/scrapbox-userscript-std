import type {
  NotFoundError,
  NotLoggedInError,
  NotMemberError,
} from "@cosense/types/rest";
import type { ResponseOfEndpoint } from "../../../../targeted_response.ts";
import { type BaseOptions, setDefaults } from "../../../../util.ts";
import { encodeTitleURI } from "../../../../title.ts";
import { cookie } from "../../../../rest/auth.ts";

/**
 * Options for {@linkcode getIcon}
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 */
export interface GetIconOption<R extends Response | undefined>
  extends BaseOptions<R> {
  /** use `followRename` */
  followRename?: boolean;
}

/** Constructs a request for the `/api/pages/:project/:title/icon` endpoint
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @param project The project name containing the desired page
 * @param title The page title to retrieve (case insensitive)
 * @param options - Additional configuration options
 * @returns A {@linkcode Request} object for fetching page data
 */
export const makeGetIconRequest = <R extends Response | undefined>(
  project: string,
  title: string,
  options?: GetIconOption<R>,
): Request => {
  const { sid, baseURL, followRename } = setDefaults(options ?? {});

  return new Request(
    `${baseURL}api/pages/${project}/${
      encodeTitleURI(title)
    }/icon?followRename=${followRename ?? true}`,
    sid ? { headers: { Cookie: cookie(sid) } } : undefined,
  );
};

/** Retrieves a specified page image
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @param project The project name containing the desired page
 * @param title The page title to retrieve (case insensitive)
 * @param options Additional configuration options for the request
 * @returns A {@linkcode Response} object containing the page image
 */
export const getIcon = <R extends Response | undefined = Response>(
  project: string,
  title: string,
  options?: GetIconOption<R>,
): Promise<
  ResponseOfEndpoint<{
    200: Blob;
    404: NotFoundError;
    401: NotLoggedInError;
    403: NotMemberError;
  }, R>
> =>
  setDefaults(options ?? {}).fetch(
    makeGetIconRequest(project, title, options),
  ) as Promise<
    ResponseOfEndpoint<{
      200: Blob;
      404: NotFoundError;
      401: NotLoggedInError;
      403: NotMemberError;
    }, R>
  >;
