export async function getProjectId(project: string) {
  const res = await fetch(`https://scrapbox.io/api/projects/${project}`);
  const json = (await res.json()) as MemberProject;
  return json.id;
}

import type {
  MemberProject,
  NotFoundError,
  NotLoggedInError,
  NotMemberError,
  NotMemberProject,
} from "../deps/scrapbox.ts";
import { cookie, makeCustomError, Result, tryToErrorLike } from "./utils.ts";

export interface ProjectInit {
  /** connect.sid */ sid: string;
}
/** get the project information
 *
 * @param project project name to get
 * @param init connect.sid etc.
 */
export async function getProject(
  project: string,
  init?: ProjectInit,
): Promise<
  Result<
    MemberProject | NotMemberProject,
    NotFoundError | NotMemberError | NotLoggedInError
  >
> {
  const path = `https://scrapbox.io/api/projects/${project}`;
  const res = await fetch(
    path,
    init?.sid
      ? {
        headers: {
          Cookie: cookie(init.sid),
        },
      }
      : undefined,
  );

  if (!res.ok) {
    const value = tryToErrorLike(await res.json()) as
      | false
      | NotFoundError
      | NotMemberError
      | NotLoggedInError;
    if (!value) {
      throw makeCustomError(
        "UnexpectedError",
        `Unexpected error has occuerd when fetching "${path}"`,
      );
    }
    return { ok: false, value };
  }
  const value = (await res.json()) as MemberProject | NotMemberProject;
  return { ok: true, value };
}
