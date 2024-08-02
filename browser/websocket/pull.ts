import {
  createErr,
  createOk,
  isErr,
  mapForResult,
  Result,
  unwrapOk,
} from "../../deps/option-t.ts";
import {
  NotFoundError,
  NotLoggedInError,
  NotMemberError,
  Page,
} from "../../deps/scrapbox-rest.ts";
import { getPage, GetPageOption, TooLongURIError } from "../../rest/pages.ts";
import { getProfile } from "../../rest/profile.ts";
import { getProject } from "../../rest/project.ts";
import { HTTPError } from "../../rest/responseIntoResult.ts";
import { AbortError, NetworkError } from "../../rest/robustFetch.ts";
import { BaseOptions } from "../../rest/util.ts";

export interface PushMetadata extends Page {
  projectId: string;
  userId: string;
}

export type PullError =
  | NotFoundError
  | NotLoggedInError
  | Omit<NotLoggedInError, "details">
  | NotMemberError
  | TooLongURIError
  | HTTPError
  | NetworkError
  | AbortError;

export const pull = async (
  project: string,
  title: string,
  options?: GetPageOption,
): Promise<Result<PushMetadata, PullError>> => {
  const [pageRes, userRes, projectRes] = await Promise.all([
    getPage(project, title, options),
    getUserId(options),
    getProjectId(project, options),
  ]);
  if (isErr(pageRes)) return pageRes;
  if (isErr(userRes)) return userRes;
  if (isErr(projectRes)) return projectRes;
  return createOk({
    ...unwrapOk(pageRes),
    projectId: unwrapOk(projectRes),
    userId: unwrapOk(userRes),
  });
};
// TODO: 編集不可なページはStream購読だけ提供する

/** cached user ID */
let userId: string | undefined;
const getUserId = async (init?: BaseOptions): Promise<
  Result<
    string,
    Omit<NotLoggedInError, "details"> | NetworkError | AbortError | HTTPError
  >
> => {
  if (userId) return createOk(userId);

  const result = await getProfile(init);
  if (isErr(result)) return result;

  const user = unwrapOk(result);
  return "id" in user ? createOk(user.id) : createErr({
    name: "NotLoggedInError",
    message: "This script cannot be used without login",
  });
};

/** cached pairs of project name and project id */
const projectMap = new Map<string, string>();
export const getProjectId = async (
  project: string,
  options?: BaseOptions,
): Promise<
  Result<
    string,
    | NotFoundError
    | NotLoggedInError
    | NotMemberError
    | NetworkError
    | AbortError
    | HTTPError
  >
> => {
  const cachedId = projectMap.get(project);
  if (cachedId) return createOk(cachedId);

  return mapForResult(
    await getProject(project, options),
    ({ id }) => {
      projectMap.set(project, id);
      return id;
    },
  );
};
