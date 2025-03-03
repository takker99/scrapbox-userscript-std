import type {
  NotFoundError,
  NotLoggedInError,
  NotMemberError,
  Page,
} from "@cosense/types/rest";
import type { ResponseOfEndpoint } from "../../../targeted_response.ts";
import { type BaseOptions, setDefaults } from "../../../util.ts";
import { encodeTitleURI } from "../../../title.ts";
import { cookie } from "../../../rest/auth.ts";

/** Options for {@linkcode getPage} */
export interface GetPageOption<R extends Response | undefined>
  extends BaseOptions<R> {
  /** use `followRename` */
  followRename?: boolean;

  /** project ids to get External links */
  projects?: string[];
}

/** Constructs a request for the `/api/pages/:project/:title` endpoint
 *
 * @param project The project name containing the desired page
 * @param title The page title to retrieve (case insensitive)
 * @param options - Additional configuration options
 * @returns A {@linkcode Request} object for fetching page data
 */
export const makeGetRequest = <R extends Response | undefined>(
  project: string,
  title: string,
  options?: GetPageOption<R>,
): Request => {
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

/** Retrieves JSON data for a specified page
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
export const get = <R extends Response | undefined = Response>(
  project: string,
  title: string,
  options?: GetPageOption<R>,
): Promise<
  | ResponseOfEndpoint<{
    200: Page;
    404: NotFoundError;
    401: NotLoggedInError;
    403: NotMemberError;
  }>
  | (undefined extends R ? undefined : never)
> =>
  setDefaults(options ?? {}).fetch(
    makeGetRequest(project, title, options),
  ) as Promise<
    | ResponseOfEndpoint<{
      200: Page;
      404: NotFoundError;
      401: NotLoggedInError;
      403: NotMemberError;
    }>
    | (undefined extends R ? undefined : never)
  >;
