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
  /** Constructs a request for the /api/project/:project endpoint
   *
   * This endpoint retrieves detailed information about a specific project,
   * which can be either a MemberProject or NotMemberProject depending on the user's access level.
   *
   * @param project The project name to retrieve information for
   * @param init Options including connect.sid (session ID) and other configuration
   * @return The constructed request object
   */
  toRequest: (
    project: string,
    options?: BaseOptions,
  ) => Request;

  /** Extracts project JSON data from the API response
   *
   * Processes the API response and extracts the project information.
   * Handles various error cases including NotFoundError, NotMemberError, and NotLoggedInError.
   *
   * @param res The API response object
   * @return A Result containing either project data or an error
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

/** get the project information
 *
 * @param project project name to get
 * @param init connect.sid etc.
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
  /** Constructs a request for the /api/projects endpoint
   *
   * This endpoint retrieves information for multiple projects in a single request.
   * The endpoint requires at least one project ID to be provided.
   *
   * @param projectIds Array of project IDs to retrieve information for (must contain at least one ID)
   * @param init Options including connect.sid (session ID) and other configuration
   * @return The constructed request object
   */
  toRequest: (
    projectIds: ProjectId[],
    init?: BaseOptions,
  ) => Request;

  /** Extracts projects JSON data from the API response
   *
   * Processes the API response and extracts information for multiple projects.
   * Handles authentication errors (NotLoggedInError) and other HTTP errors.
   *
   * @param res The API response object
   * @return A Result containing either project data or an error
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

/** list the projects' information
 *
 * @param projectIds project ids. This must have more than 1 id
 * @param init connect.sid etc.
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
