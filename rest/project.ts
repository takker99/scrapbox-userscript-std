import {
  isErr,
  mapAsyncForResult,
  mapErrAsyncForResult,
  type Result,
  unwrapOk,
} from "option-t/plain_result";
import type {
  MemberProject,
  NotFoundError,
  NotLoggedInError,
  NotMemberError,
  NotMemberProject,
  ProjectId,
  ProjectResponse,
} from "@cosense/types/rest";
import { cookie } from "./auth.ts";
import { parseHTTPError } from "./parseHTTPError.ts";
import { type HTTPError, responseIntoResult } from "./responseIntoResult.ts";
import type { FetchError } from "./robustFetch.ts";
import { type BaseOptions, setDefaults } from "./options.ts";

export interface GetProject {
  /** Constructs a request for the `/api/project/:project` endpoint
   *
   * This endpoint retrieves detailed information about a specific project,
   * which can be either a {@linkcode MemberProject} or {@linkcode NotMemberProject} depending on the user's access level.
   *
   * @param project - The project name to retrieve information for
   * @param init - Options including connect.sid (session ID) and other configuration
   * @returns A {@linkcode Request} object for fetching project data
   */
  toRequest: (
    project: string,
    options?: BaseOptions,
  ) => Request;

  /** Extracts project JSON data from the API response
   *
   * Processes the API response and extracts the project information.
   * Handles various error cases including {@linkcode NotFoundError}, {@linkcode NotMemberError}, and {@linkcode NotLoggedInError}.
   *
   * @param res - The API response object
   * @returns A {@linkcode Result}<{@linkcode MemberProject} | {@linkcode NotMemberProject}, {@linkcode ProjectError}> containing:
   *          - Success: The project data with access level information
   *          - Error: One of several possible errors:
   *            - {@linkcode NotFoundError}: Project does not exist
   *            - {@linkcode NotMemberError}: User lacks access
   *            - {@linkcode NotLoggedInError}: Authentication required
   *            - {@linkcode HTTPError}: Other HTTP errors
   */
  fromResponse: (
    res: Response,
  ) => Promise<Result<MemberProject | NotMemberProject, ProjectError>>;

  (
    project: string,
    options?: BaseOptions,
  ): Promise<
    Result<MemberProject | NotMemberProject, ProjectError | FetchError>
  >;
}

export type ProjectError =
  | NotFoundError
  | NotMemberError
  | NotLoggedInError
  | HTTPError;

const getProject_toRequest: GetProject["toRequest"] = (project, init) => {
  const { sid, hostName } = setDefaults(init ?? {});

  return new Request(
    `https://${hostName}/api/projects/${project}`,
    sid ? { headers: { Cookie: cookie(sid) } } : undefined,
  );
};

const getProject_fromResponse: GetProject["fromResponse"] = async (res) =>
  mapAsyncForResult(
    await mapErrAsyncForResult(
      responseIntoResult(res),
      async (error) =>
        (await parseHTTPError(error, [
          "NotFoundError",
          "NotLoggedInError",
          "NotMemberError",
        ])) ?? error,
    ),
    (res) => res.json() as Promise<MemberProject | NotMemberProject>,
  );

/** Get detailed information about a Scrapbox project
 *
 * This function retrieves detailed information about a project, including its
 * access level, settings, and metadata. The returned data type depends on
 * whether the user has member access to the project.
 *
 * @param project - Project name to retrieve information for
 * @param init - Options including `connect.sid` for authentication
 * @returns A {@linkcode Result}<{@linkcode MemberProject} | {@linkcode NotMemberProject}, {@linkcode ProjectError} | {@linkcode FetchError}> containing:
 *          - Success: Project information based on access level:
 *            - {@linkcode MemberProject}: Full project data for members
 *            - {@linkcode NotMemberProject}: Limited data for non-members
 *          - Error: One of several possible errors:
 *            - {@linkcode NotFoundError}: Project does not exist
 *            - {@linkcode NotMemberError}: User lacks access
 *            - {@linkcode NotLoggedInError}: Authentication required
 *            - {@linkcode HTTPError}: Server errors
 *            - {@linkcode FetchError}: Network errors
 */
export const getProject: GetProject = /* @__PURE__ */ (() => {
  const fn: GetProject = async (
    project,
    init,
  ) => {
    const { fetch } = setDefaults(init ?? {});

    const req = getProject_toRequest(project, init);
    const res = await fetch(req);
    if (isErr(res)) return res;

    return getProject_fromResponse(unwrapOk(res));
  };

  fn.toRequest = getProject_toRequest;
  fn.fromResponse = getProject_fromResponse;

  return fn;
})();

export interface ListProjects {
  /** Constructs a request for the `/api/projects` endpoint
   *
   * This endpoint retrieves information for multiple projects in a single request.
   * The endpoint requires at least one project ID to be provided.
   *
   * @param projectIds - Array of project IDs to retrieve information for (must contain at least one ID)
   * @param init - Options including `connect.sid` (session ID) and other configuration
   * @returns A {@linkcode Request} object for fetching multiple projects' data
   */
  toRequest: (
    projectIds: ProjectId[],
    init?: BaseOptions,
  ) => Request;

  /** Extracts projects JSON data from the API response
   *
   * Processes the API response and extracts information for multiple projects.
   * Handles authentication errors ({@linkcode NotLoggedInError}) and other HTTP errors.
   *
   * @param res - The API response object
   * @returns A {@linkcode Result}<{@linkcode ProjectData}, {@linkcode ProjectError}> containing:
   *          - Success: The project data
   *          - Error: One of several possible errors:
   *            - {@linkcode NotFoundError}: Project not found
   *            - {@linkcode HTTPError}: Other HTTP errors
   */
  fromResponse: (
    res: Response,
  ) => Promise<Result<ProjectResponse, ListProjectsError>>;

  (
    projectIds: ProjectId[],
    init?: BaseOptions,
  ): Promise<Result<ProjectResponse, ListProjectsError | FetchError>>;
}

export type ListProjectsError = NotLoggedInError | HTTPError;

const ListProject_toRequest: ListProjects["toRequest"] = (projectIds, init) => {
  const { sid, hostName } = setDefaults(init ?? {});
  const params = new URLSearchParams(
    projectIds.map((id) => ["ids", id]),
  );

  return new Request(
    `https://${hostName}/api/projects?${params}`,
    sid ? { headers: { Cookie: cookie(sid) } } : undefined,
  );
};

const ListProject_fromResponse: ListProjects["fromResponse"] = async (res) =>
  mapAsyncForResult(
    await mapErrAsyncForResult(
      responseIntoResult(res),
      async (error) =>
        (await parseHTTPError(error, ["NotLoggedInError"])) ?? error,
    ),
    (res) => res.json() as Promise<ProjectResponse>,
  );

/** List information for multiple Scrapbox projects
 *
 * This function retrieves information for multiple projects in a single request.
 * At least one project ID must be provided.
 *
 * @param projectIds - Array of project IDs to retrieve (must contain at least one ID)
 * @param init - Options including `connect.sid` for authentication
 * @returns A {@linkcode Result}<{@linkcode ProjectResponse}, {@linkcode ListProjectsError} | {@linkcode FetchError}> containing:
 *          - Success: Project data for all requested projects
 *          - Error: One of several possible errors:
 *            - {@linkcode NotLoggedInError}: Authentication required
 *            - {@linkcode HTTPError}: Server errors
 *            - {@linkcode FetchError}: Network errors
 */
export const listProjects: ListProjects = /* @__PURE__ */ (() => {
  const fn: ListProjects = async (
    projectIds,
    init,
  ) => {
    const { fetch } = setDefaults(init ?? {});

    const res = await fetch(ListProject_toRequest(projectIds, init));
    if (isErr(res)) return res;

    return ListProject_fromResponse(unwrapOk(res));
  };

  fn.toRequest = ListProject_toRequest;
  fn.fromResponse = ListProject_fromResponse;

  return fn;
})();
