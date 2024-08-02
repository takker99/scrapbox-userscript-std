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
import type { AbortError, NetworkError } from "./robustFetch.ts";
import { type BaseOptions, setDefaults } from "./util.ts";

export interface GetProject {
  /** /api/project/:project の要求を組み立てる
   *
   * @param project project name to get
   * @param init connect.sid etc.
   * @return request
   */
  toRequest: (
    project: string,
    options?: BaseOptions,
  ) => Request;

  /** 帰ってきた応答からprojectのJSONデータを取得する
   *
   * @param res 応答
   * @return projectのJSONデータ
   */
  fromResponse: (res: Response) => Promise<
    Result<
      MemberProject | NotMemberProject,
      | NotFoundError
      | NotMemberError
      | NotLoggedInError
      | NetworkError
      | AbortError
      | HTTPError
    >
  >;

  (project: string, options?: BaseOptions): Promise<
    Result<
      MemberProject | NotMemberProject,
      | NotFoundError
      | NotMemberError
      | NotLoggedInError
      | NetworkError
      | AbortError
      | HTTPError
    >
  >;
}

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
export const getProject: GetProject = async (
  project,
  init,
) => {
  const { fetch } = setDefaults(init ?? {});

  const req = getProject_toRequest(project, init);
  const res = await fetch(req);
  if (isErr(res)) return res;

  return getProject_fromResponse(unwrapOk(res));
};

getProject.toRequest = getProject_toRequest;
getProject.fromResponse = getProject_fromResponse;

export interface ListProjects {
  /** /api/project の要求を組み立てる
   *
   * @param projectIds project ids. This must have more than 1 id
   * @param init connect.sid etc.
   * @return request
   */
  toRequest: (
    projectIds: ProjectId[],
    init?: BaseOptions,
  ) => Request;

  /** 帰ってきた応答からprojectのJSONデータを取得する
   *
   * @param res 応答
   * @return projectのJSONデータ
   */
  fromResponse: (
    res: Response,
  ) => Promise<
    Result<
      ProjectResponse,
      NotLoggedInError | NetworkError | AbortError | HTTPError
    >
  >;

  (
    projectIds: ProjectId[],
    init?: BaseOptions,
  ): Promise<
    Result<
      ProjectResponse,
      NotLoggedInError | NetworkError | AbortError | HTTPError
    >
  >;
}

const ListProject_toRequest: ListProjects["toRequest"] = (projectIds, init) => {
  const { sid, hostName } = setDefaults(init ?? {});
  const param = new URLSearchParams();
  for (const id of projectIds) {
    param.append("ids", id);
  }

  return new Request(
    `https://${hostName}/api/projects?${param.toString()}`,
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
export const listProjects: ListProjects = async (
  projectIds,
  init,
) => {
  const { fetch } = setDefaults(init ?? {});

  const res = await fetch(ListProject_toRequest(projectIds, init));
  if (isErr(res)) return res;

  return ListProject_fromResponse(unwrapOk(res));
};

listProjects.toRequest = ListProject_toRequest;
listProjects.fromResponse = ListProject_fromResponse;
