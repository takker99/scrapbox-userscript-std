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
import type { TargetedResponse } from "./targeted_response.ts";
import {
  createErrorResponse as _createErrorResponse,
  createSuccessResponse as _createSuccessResponse,
  createTargetedResponse,
} from "./utils.ts";
import type { FetchError } from "./robustFetch.ts";
import { type BaseOptions, setDefaults } from "./options.ts";

export interface GetProject {
  /** Build request for /api/project/:project
   *
   * @param project Project name to get
   * @param init connect.sid etc.
   * @return request
   */
  toRequest: (
    project: string,
    options?: BaseOptions,
  ) => Request;

  /** Get project JSON data from response
   *
   * @param res Response object
   * @return Project JSON data
   */
  fromResponse: (
    res: Response,
  ) => Promise<
    TargetedResponse<
      200 | 400 | 404,
      MemberProject | NotMemberProject | ProjectError
    >
  >;

  (
    project: string,
    options?: BaseOptions,
  ): Promise<
    TargetedResponse<
      200 | 400 | 404,
      MemberProject | NotMemberProject | ProjectError | FetchError
    >
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

const getProject_fromResponse: GetProject["fromResponse"] = async (res) => {
  const response = createTargetedResponse<
    200 | 400 | 404,
    MemberProject | NotMemberProject | ProjectError
  >(res);

  await parseHTTPError(response, [
    "NotFoundError",
    "NotLoggedInError",
    "NotMemberError",
  ]);

  return response;
};

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
    const response = await fetch(req);
    return getProject_fromResponse(response);
  };

  fn.toRequest = getProject_toRequest;
  fn.fromResponse = getProject_fromResponse;

  return fn;
})();

export interface ListProjects {
  /** Build request for /api/project
   *
   * @param projectIds Project IDs (must have more than 1 ID)
   * @param init connect.sid etc.
   * @return request
   */
  toRequest: (
    projectIds: ProjectId[],
    init?: BaseOptions,
  ) => Request;

  /** Get projects JSON data from response
   *
   * @param res Response object
   * @return Projects JSON data
   */
  fromResponse: (
    res: Response,
  ) => Promise<
    TargetedResponse<200 | 400 | 404, ProjectResponse | ListProjectsError>
  >;

  (
    projectIds: ProjectId[],
    init?: BaseOptions,
  ): Promise<
    TargetedResponse<
      200 | 400 | 404,
      ProjectResponse | ListProjectsError | FetchError
    >
  >;
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

const ListProject_fromResponse: ListProjects["fromResponse"] = async (res) => {
  const response = createTargetedResponse<
    200 | 400 | 404,
    ProjectResponse | ListProjectsError
  >(res);

  await parseHTTPError(response, ["NotLoggedInError"]);

  return response;
};

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

    const response = await fetch(ListProject_toRequest(projectIds, init));
    return ListProject_fromResponse(response);
  };

  fn.toRequest = ListProject_toRequest;
  fn.fromResponse = ListProject_fromResponse;

  return fn;
})();
