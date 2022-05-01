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
import { UnexpectedResponseError } from "./error.ts";
import { tryToErrorLike } from "../is.ts";
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
  const path = `https://${hostName}/api/projects/${project}`;
  const res = await fetch(
    path,
    sid ? { headers: { Cookie: cookie(sid) } } : undefined,
  );

  if (!res.ok) {
    const text = await res.text();
    const value = tryToErrorLike(text);
    if (!value) {
      throw new UnexpectedResponseError({
        path: new URL(path),
        ...res,
        body: text,
      });
    }
    return {
      ok: false,
      value: value as NotFoundError | NotMemberError | NotLoggedInError,
    };
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
  const path = `https://${hostName}/api/projects?${param.toString()}`;
  const res = await fetch(
    path,
    sid ? { headers: { Cookie: cookie(sid) } } : undefined,
  );

  if (!res.ok) {
    const text = await res.text();
    const value = tryToErrorLike(text);
    if (!value) {
      throw new UnexpectedResponseError({
        path: new URL(path),
        ...res,
        body: text,
      });
    }
    return {
      ok: false,
      value: value as NotLoggedInError,
    };
  }

  const value = (await res.json()) as ProjectResponse;
  return { ok: true, value };
};
