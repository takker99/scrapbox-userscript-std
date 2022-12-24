import type {
  MemberProject,
  NotFoundError,
  NotLoggedInError,
  NotMemberError,
  NotMemberProject,
  ProjectId,
  ProjectResponse,
} from "../deps/scrapbox-rest.ts";
import { cookie } from "./auth.ts";
import { makeError } from "./error.ts";
import { BaseOptions, Result, setDefaults } from "./util.ts";

/** get the project information
 *
 * @param project project name to get
 * @param init connect.sid etc.
 */
export const getProject = async (
  project: string,
  init?: BaseOptions,
): Promise<
  Result<
    MemberProject | NotMemberProject,
    NotFoundError | NotMemberError | NotLoggedInError
  >
> => {
  const { sid, hostName, fetch } = setDefaults(init ?? {});

  const req = new Request(
    `https://${hostName}/api/projects/${project}`,
    sid ? { headers: { Cookie: cookie(sid) } } : undefined,
  );

  const res = await fetch(req);

  if (!res.ok) {
    return makeError<NotFoundError | NotMemberError | NotLoggedInError>(
      req,
      res,
    );
  }

  const value = (await res.json()) as MemberProject | NotMemberProject;
  return { ok: true, value };
};

/** list the projects' information
 *
 * @param projectIds project ids. This must have more than 1 id
 * @param init connect.sid etc.
 */
export const listProjects = async (
  projectIds: ProjectId[],
  init?: BaseOptions,
): Promise<Result<ProjectResponse, NotLoggedInError>> => {
  const { sid, hostName, fetch } = setDefaults(init ?? {});
  const param = new URLSearchParams();
  for (const id of projectIds) {
    param.append("ids", id);
  }

  const req = new Request(
    `https://${hostName}/api/projects?${param.toString()}`,
    sid ? { headers: { Cookie: cookie(sid) } } : undefined,
  );

  const res = await fetch(req);

  if (!res.ok) {
    return makeError<NotLoggedInError>(req, res);
  }

  const value = (await res.json()) as ProjectResponse;
  return { ok: true, value };
};
