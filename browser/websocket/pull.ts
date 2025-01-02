import type {
  GuestUser,
  MemberUser,
  NotFoundError,
  NotLoggedInError,
  NotMemberError,
  Page,
} from "@cosense/types/rest";
import {
  createErrorResponse,
  createSuccessResponse,
} from "../../rest/utils.ts";
import {
  getPage,
  type GetPageOption,
  type TooLongURIError,
} from "../../rest/pages.ts";
import { getProfile } from "../../rest/profile.ts";
import { getProject } from "../../rest/project.ts";
import type { HTTPError } from "../../rest/errors.ts";
import type { AbortError, NetworkError } from "../../rest/robustFetch.ts";
import type { BaseOptions } from "../../rest/options.ts";
import type { TargetedResponse } from "../../rest/targeted_response.ts";

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
): Promise<
  TargetedResponse<200 | 400 | 404 | 408 | 500, PushMetadata | PullError>
> => {
  const [pageRes, userRes, projectRes] = await Promise.all([
    getPage(project, title, options),
    getUserId(options),
    getProjectId(project, options),
  ]);

  if (!pageRes.ok || !userRes.ok || !projectRes.ok) {
    const status = pageRes.ok
      ? (userRes.ok ? projectRes.status : userRes.status)
      : pageRes.status;
    const errorStatus = status === 404
      ? 404
      : (status === 408 ? 408 : (status === 500 ? 500 : 400));
    return createErrorResponse(errorStatus, {
      message: "Failed to fetch required data",
    } as PullError);
  }

  const page = await pageRes.json() as Page;
  const userId = await userRes.clone().text();
  const projectId = await projectRes.clone().text();

  const metadata: PushMetadata = {
    ...page,
    projectId,
    userId,
  };
  return createSuccessResponse(metadata);
};
// TODO: 編集不可なページはStream購読だけ提供する

/** cached user ID */
let userId: string | undefined;
const getUserId = async (init?: BaseOptions): Promise<
  TargetedResponse<
    200 | 400 | 404 | 408 | 500,
    | string
    | Omit<NotLoggedInError, "details">
    | NetworkError
    | AbortError
    | HTTPError
  >
> => {
  if (userId) {
    return createSuccessResponse(userId);
  }

  const result = await getProfile(init);
  if (!result.ok) {
    return createErrorResponse(400, {
      name: "NotLoggedInError",
      message: "Failed to fetch profile",
    });
  }

  const user = await result.json() as MemberUser | GuestUser;
  if ("id" in user) {
    userId = user.id;
    return createSuccessResponse(user.id);
  }
  return createErrorResponse(400, {
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
  TargetedResponse<
    200 | 400 | 404 | 408 | 500,
    | string
    | NotFoundError
    | NotLoggedInError
    | NotMemberError
    | NetworkError
    | AbortError
    | HTTPError
  >
> => {
  const cachedId = projectMap.get(project);
  if (cachedId) {
    return createSuccessResponse(cachedId);
  }

  const result = await getProject(project, options);
  if (!result.ok) {
    return createErrorResponse(404, {
      name: "NotFoundError",
      message: `Project ${project} not found`,
      project,
    });
  }

  const data = await result.json();
  const id = (data as { id: string }).id;
  projectMap.set(project, id);
  return createSuccessResponse(id);
};
