import type {
  BadRequestError,
  NotFoundError,
  NotLoggedInError,
  NotMemberError,
} from "@cosense/types/rest";
import { type BaseOptions, setDefaults } from "../../../util.ts";
import { cookie } from "../../../rest/auth.ts";
import type { ResponseOfEndpoint } from "../../../targeted_response.ts";

/** Options for {@linkcode export2HopLinks}
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 */
export type Export2HopLinksOptions<R extends Response | undefined> =
  BaseOptions<R>;

/** Constructs a request for the `/api/smart-context/export-2hop-links/:project.txt` endpoint
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @param project The project name to export 2-hop links for
 * @param title The title of the page to export 2-hop links for
 * @param options - Configuration options
 * @returns A {@linkcode Request} object for the API endpoint
 */
export const makeExport2HopLinksRequest = <R extends Response | undefined>(
  project: string,
  title: string,
  options?: Export2HopLinksOptions<R>,
): Request => {
  const { sid, baseURL } = setDefaults(options ?? {});
  const params = new URLSearchParams({ title: title });

  return new Request(
    `${baseURL}api/smart-context/export-2hop-links/${project}.txt?${params}`,
    sid ? { headers: { Cookie: cookie(sid) } } : undefined,
  );
};

/** Exports 2-hop links for a given page in a project as AI-readable text format.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @param project The project name to export 2-hop links for
 * @param title The title of the page to export 2-hop links for
 * @param options - Configuration options. **Make sure to set `sid` or you will never get the 200 OK response.**
 */
export const export2HopLinks = <R extends Response | undefined = Response>(
  project: string,
  title: string,
  options?: Export2HopLinksOptions<R>,
): Promise<
  ResponseOfEndpoint<{
    200: string;
    404: NotFoundError;
    400: BadRequestError;
    401: NotLoggedInError;
    403: NotMemberError;
  }, R>
> =>
  setDefaults(options ?? {}).fetch(
    makeExport2HopLinksRequest(project, title, options),
  ) as Promise<
    ResponseOfEndpoint<{
      200: string;
      400: BadRequestError;
      404: NotFoundError;
      401: NotLoggedInError;
      403: NotMemberError;
    }, R>
  >;
