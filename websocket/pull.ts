import {
  createErr,
  createOk,
  isErr,
  mapForResult,
  type Result,
  unwrapOk,
} from "option-t/plain_result";
import type {
  NotFoundError,
  NotLoggedInError,
  NotMemberError,
  Page,
} from "@cosense/types/rest";
import {
  getPage,
  type GetPageOption,
  type TooLongURIError,
} from "../rest/pages.ts";
import { getProfile } from "../rest/profile.ts";
import { getProject } from "../rest/project.ts";
import type { HTTPError } from "../rest/responseIntoResult.ts";
import type { AbortError, NetworkError } from "../rest/robustFetch.ts";
import type { BaseOptions } from "../rest/options.ts";

/** Extended page metadata required for WebSocket operations
 *
 * This interface extends the basic {@linkcode Page} type with additional identifiers
 * needed for real-time collaboration and page modifications.
 */
export interface PushMetadata extends Page<boolean> {
  /** Unique identifier of the project containing the page */
  projectId: string;
  /** Unique identifier of the current user */
  userId: string;
}

/** Comprehensive error type for page data retrieval operations
 *
 * This union type includes all possible errors that may occur when
 * fetching page data, including:
 * - Authentication errors: {@linkcode NotLoggedInError}
 * - Authorization errors: {@linkcode NotMemberError}
 * - Resource errors: {@linkcode NotFoundError}, {@linkcode TooLongURIError}
 * - Network errors: {@linkcode NetworkError}, {@linkcode AbortError}, {@linkcode HTTPError}
 */
export type PullError =
  | NotFoundError
  | NotLoggedInError
  | Omit<NotLoggedInError, "details">
  | NotMemberError
  | TooLongURIError
  | HTTPError
  | NetworkError
  | AbortError;

/** Fetch page data along with required metadata for WebSocket operations
 *
 * This function performs three parallel operations:
 * 1. Fetches the page content
 * 2. Retrieves the current user's ID (with caching)
 * 3. Retrieves the project ID (with caching)
 *
 * If any operation fails, the entire operation fails with appropriate error.
 *
 * @param project - Project containing the target page
 * @param title - Title of the page to fetch
 * @param options - Optional settings for the page request
 * @returns A {@linkcode Result} containing:
 *          - Success: A {@linkcode PushMetadata} object with page data and required metadata
 *          - Error: A {@linkcode PullError} which could be one of:
 *            - {@linkcode NotFoundError}: Page not found
 *            - {@linkcode NotLoggedInError}: User not authenticated
 *            - {@linkcode NotMemberError}: User not authorized
 *            - {@linkcode TooLongURIError}: Request URI too long
 *            - {@linkcode HTTPError}: General HTTP error
 *            - {@linkcode NetworkError}: Network connectivity issue
 *            - {@linkcode AbortError}: Request aborted
 */
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
// TODO: For read-only pages, provide stream subscription only

/** Cached user ID to avoid redundant profile API calls */
let userId: string | undefined;

/** Get the current user's ID with caching
 *
 * This function caches the user ID in memory to reduce API calls.
 * The cache is invalidated when the page is reloaded.
 *
 * @param init - Optional base request options
 * @returns A {@linkcode Result} containing:
 *          - Success: The user ID as a {@linkcode string}
 *          - Error: One of the following:
 *            - {@linkcode NotLoggedInError}: User not authenticated
 *            - {@linkcode NetworkError}: Network connectivity issue
 *            - {@linkcode AbortError}: Request aborted
 *            - {@linkcode HTTPError}: General HTTP error
 */
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
  if ("id" in user) {
    userId = user.id;
    return createOk(user.id);
  }
  return createErr({
    name: "NotLoggedInError",
    message: "This script cannot be used without login",
  });
};

/** Cache mapping project names to their unique IDs */
const projectMap = new Map<string, string>();

/** Get a project's ID with caching
 *
 * This function maintains a cache of project IDs to reduce API calls.
 * The cache is invalidated when the page is reloaded.
 *
 * @param project - Name of the project
 * @param options - Optional base request options
 * @returns A {@linkcode Result} containing:
 *          - Success: The project ID as a {@linkcode string}
 *          - Error: One of the following:
 *            - {@linkcode NotFoundError}: Project not found
 *            - {@linkcode NotLoggedInError}: User not authenticated
 *            - {@linkcode NotMemberError}: User not authorized
 *            - {@linkcode NetworkError}: Network connectivity issue
 *            - {@linkcode AbortError}: Request aborted
 *            - {@linkcode HTTPError}: General HTTP error
 */
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
