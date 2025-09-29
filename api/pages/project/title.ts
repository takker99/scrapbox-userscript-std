import type {
  NotFoundError,
  NotLoggedInError,
  NotMemberError,
  PageWithInfoboxDefinition,
  PageWithoutInfoboxDefinition,
} from "@cosense/types/rest";
import type { ResponseOfEndpoint } from "../../../targeted_response.ts";
import { type BaseOptions, setDefaults } from "../../../util.ts";
import { encodeTitleURI } from "../../../title.ts";
import { cookie } from "../../../rest/auth.ts";

/**
 * Options for {@linkcode getPage}
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 */
export interface GetPageOption<R extends Response | undefined>
  extends BaseOptions<R> {
  /** use `followRename` */
  followRename?: boolean;

  /** project ids to get External links */
  projects?: string[];
}

/** Constructs a request for the `/api/pages/:project/:title` endpoint
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @param project The project name containing the desired page
 * @param title The page title to retrieve (case insensitive)
 * @param options - Additional configuration options
 * @returns A {@linkcode Request} object for fetching page data
 */
export const makeGetPageRequest = <R extends Response | undefined>(
  project: string,
  title: string,
  options?: GetPageOption<R>,
): Request => {
  const { sid, baseURL, followRename, projects } = setDefaults(options ?? {});

  const params = new URLSearchParams([
    ["followRename", `${followRename ?? true}`],
    ...(projects?.map?.((id) => ["projects", id]) ?? []),
  ]);

  return new Request(
    `${baseURL}api/pages/${project}/${encodeTitleURI(title)}?${params}`,
    sid ? { headers: { Cookie: cookie(sid) } } : undefined,
  );
};

/** Retrieves JSON data for a specified page
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @param project The project name containing the desired page
 * @param title The page title to retrieve (case insensitive)
 * @param options Additional configuration options for the request
 * @returns A {@linkcode Result}<{@linkcode unknown}, {@linkcode Error}> containing:
 *          - Success: The page data in JSON format
 *          - Error: One of several possible errors:
 *            - {@linkcode NotFoundError}: Page not found
 *            - {@linkcode NotLoggedInError}: Authentication required
 *            - {@linkcode NotMemberError}: User lacks access
 */
export const getPage = <R extends Response | undefined = Response>(
  project: string,
  title: string,
  options?: GetPageOption<R>,
): Promise<
  ResponseOfEndpoint<{
    200: PageWithInfoboxDefinition | PageWithoutInfoboxDefinition;
    404: NotFoundError;
    401: NotLoggedInError;
    403: NotMemberError;
  }, R>
> =>
  setDefaults(options ?? {}).fetch(
    makeGetPageRequest(project, title, options),
  ) as Promise<
    ResponseOfEndpoint<{
      200: PageWithInfoboxDefinition | PageWithoutInfoboxDefinition;
      404: NotFoundError;
      401: NotLoggedInError;
      403: NotMemberError;
    }, R>
  >;

export * from "./title/text.ts";
export * from "./title/icon.ts";
