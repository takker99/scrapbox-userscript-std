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
 * Options for {@linkcode get}
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 */
export interface GetTextOption<R extends Response | undefined>
  extends BaseOptions<R> {
  /** use `followRename` */
  followRename?: boolean;
}

/** Constructs a request for the `/api/pages/:project/:title/text` endpoint
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @param project The project name containing the desired page
 * @param title The page title to retrieve (case insensitive)
 * @param options - Additional configuration options
 * @returns A {@linkcode Request} object for fetching page data
 */
export const makeGetRequest = <R extends Response | undefined>(
  project: string,
  title: string,
  options?: GetTextOption<R>,
): Request => {
  const { sid, baseURL, followRename } = setDefaults(options ?? {});

  return new Request(
    `${baseURL}api/pages/${project}/${
      encodeTitleURI(title)
    }/text?followRename=${followRename ?? true}`,
    sid ? { headers: { Cookie: cookie(sid) } } : undefined,
  );
};

/** Retrieves a specified page text
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @param project The project name containing the desired page
 * @param title The page title to retrieve (case insensitive)
 * @param options Additional configuration options for the request
 * @returns A {@linkcode Response} object containing the page text
 */
export const get = <R extends Response | undefined = Response>(
  project: string,
  title: string,
  options?: GetTextOption<R>,
): Promise<
  ResponseOfEndpoint<{
    200: string;
    404: NotFoundError;
    401: NotLoggedInError;
    403: NotMemberError;
  }, R>
> =>
  setDefaults(options ?? {}).fetch(
    makeGetRequest(project, title, options),
  ) as Promise<
    ResponseOfEndpoint<{
      200: string;
      404: NotFoundError;
      401: NotLoggedInError;
      403: NotMemberError;
    }, R>
  >;
