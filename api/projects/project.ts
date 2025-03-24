import type {
  MemberProject,
  NotFoundError,
  NotLoggedInError,
  NotMemberError,
  NotMemberProject,
} from "@cosense/types/rest";
import type { ResponseOfEndpoint } from "../../targeted_response.ts";
import { type BaseOptions, setDefaults } from "../../util.ts";
import { cookie } from "../../rest/auth.ts";

/** Create a request to `GET /api/projects/:project`
 *
 * @param project - Project name to retrieve information for
 * @param options - Additional configuration options
 * @returns A {@linkcode Request} object for fetching project data
 */
export const makeGetRequest = <R extends Response | undefined>(
  project: string,
  options?: BaseOptions<R>,
): Request => {
  const { sid, baseURL } = setDefaults(options ?? {});

  return new Request(
    `${baseURL}api/projects/${project}`,
    sid ? { headers: { Cookie: cookie(sid) } } : undefined,
  );
};

/** Get detailed information about a Scrapbox project
 *
 * This function retrieves detailed information about a project, including its
 * access level, settings, and metadata. The returned data type depends on
 * whether the user has member access to the project.
 *
 * @param project - Project name to retrieve information for
 * @param options Additional configuration options for the request
 * @returns A {@linkcode Response} object containing the project data
 */
export const get = <R extends Response | undefined = Response>(
  project: string,
  options?: BaseOptions<R>,
): Promise<
  ResponseOfEndpoint<{
    200: MemberProject | NotMemberProject;
    404: NotFoundError;
    401: NotLoggedInError;
    403: NotMemberError;
  }, R>
> =>
  setDefaults(options ?? {}).fetch(
    makeGetRequest(project, options),
  ) as Promise<
    ResponseOfEndpoint<{
      200: MemberProject | NotMemberProject;
      404: NotFoundError;
      401: NotLoggedInError;
      403: NotMemberError;
    }, R>
  >;
