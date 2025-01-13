import type {
  ErrorLike,
  NotFoundError,
  NotLoggedInError,
  NotMemberError,
  PageSnapshotList,
  PageSnapshotResult,
} from "@cosense/types/rest";
import { cookie } from "./auth.ts";
import { type BaseOptions, setDefaults } from "./options.ts";
import { parseHTTPError } from "./parseHTTPError.ts";
import {
  isErr,
  mapAsyncForResult,
  mapErrAsyncForResult,
  type Result,
  unwrapOk,
} from "option-t/plain_result";
import { type HTTPError, responseIntoResult } from "./responseIntoResult.ts";
import type { FetchError } from "./mod.ts";

/** Error that occurs when an invalid `timestampId` is provided to {@linkcode getSnapshot}
 *
 * Extends {@linkcode ErrorLike} with a specific error name for invalid snapshot IDs.
 */
export interface InvalidPageSnapshotIdError extends ErrorLike {
  name: "InvalidPageSnapshotIdError";
}

/** Union type of all possible errors that can occur when retrieving a page snapshot
 *
 * Includes:
 * - {@linkcode NotFoundError}: Page or project not found
 * - {@linkcode NotLoggedInError}: User authentication required
 * - {@linkcode NotMemberError}: User lacks project access
 * - {@linkcode InvalidPageSnapshotIdError}: Invalid snapshot ID provided
 * - {@linkcode HTTPError}: Server or network error
 */
export type SnapshotError =
  | NotFoundError
  | NotLoggedInError
  | NotMemberError
  | InvalidPageSnapshotIdError
  | HTTPError;

/** Retrieve a specific version of a page from its snapshot history
 *
 * @param project - The name of the Scrapbox project containing the page
 * @param pageId - The ID of the page to retrieve the snapshot for
 * @param timestampId - The specific snapshot timestamp ID to retrieve
 * @param options - Optional configuration including {@linkcode BaseOptions} like `connect.sid`
 * @returns A {@linkcode Result}<{@linkcode PageSnapshotResult}, {@linkcode SnapshotError} | {@linkcode FetchError}> containing:
 *          - Success: A {@linkcode PageSnapshotResult} containing the page snapshot data
 *          - Error: One of several possible errors:
 *            - {@linkcode SnapshotError} or {@linkcode FetchError}: Network or API errors
 *            - {@linkcode NotFoundError}: Page or project not found
 *            - {@linkcode NotLoggedInError}: User authentication required
 *            - {@linkcode NotMemberError}: User lacks project access
 *            - {@linkcode InvalidPageSnapshotIdError}: Invalid timestamp ID
 *            - {@linkcode HTTPError}: Server or network error
 *            - {@linkcode FetchError}: Request failed
 */
export const getSnapshot = async (
  project: string,
  pageId: string,
  timestampId: string,
  options?: BaseOptions,
): Promise<Result<PageSnapshotResult, SnapshotError | FetchError>> => {
  const { sid, hostName, fetch } = setDefaults(options ?? {});

  const req = new Request(
    `https://${hostName}/api/page-snapshots/${project}/${pageId}/${timestampId}`,
    sid ? { headers: { Cookie: cookie(sid) } } : undefined,
  );

  const res = await fetch(req);
  if (isErr(res)) return res;

  return mapAsyncForResult(
    await mapErrAsyncForResult(
      responseIntoResult(unwrapOk(res)),
      async (error) =>
        error.response.status === 422
          ? {
            name: "InvalidPageSnapshotIdError",
            message: await error.response.text(),
          }
          : (await parseHTTPError(error, [
            "NotFoundError",
            "NotLoggedInError",
            "NotMemberError",
          ])) ?? error,
    ),
    (res) => res.json() as Promise<PageSnapshotResult>,
  );
};

/** Union type of all possible errors that can occur when retrieving snapshot timestamp IDs
 *
 * Includes:
 * - {@linkcode NotFoundError}: Page or project not found
 * - {@linkcode NotLoggedInError}: User authentication required
 * - {@linkcode NotMemberError}: User lacks project access
 * - {@linkcode HTTPError}: Server or network error
 */
export type SnapshotTimestampIdsError =
  | NotFoundError
  | NotLoggedInError
  | NotMemberError
  | HTTPError;

/**
 * Retrieves the timestamp IDs for a specific page in a project.
 *
 * @param project - The name of the Scrapbox project to retrieve snapshots from
 * @param pageId - The ID of the page to retrieve snapshot history for
 * @param options - Optional {@linkcode BaseOptions} configuration including authentication
 * @returns A {@linkcode Result}<{@linkcode PageSnapshotList}, {@linkcode SnapshotTimestampIdsError} | {@linkcode FetchError}> containing:
 *          - Success: A {@linkcode PageSnapshotList} containing the page's snapshot history
 *          - Error: One of several possible errors:
 *            - {@linkcode NotFoundError}: Page or project not found
 *            - {@linkcode NotLoggedInError}: User authentication required
 *            - {@linkcode NotMemberError}: User lacks project access
 *            - {@linkcode HTTPError}: Server or network error
 *            - {@linkcode FetchError}: Request failed
 */
export const getTimestampIds = async (
  project: string,
  pageId: string,
  options?: BaseOptions,
): Promise<
  Result<PageSnapshotList, SnapshotTimestampIdsError | FetchError>
> => {
  const { sid, hostName, fetch } = setDefaults(options ?? {});

  const req = new Request(
    `https://${hostName}/api/page-snapshots/${project}/${pageId}`,
    sid ? { headers: { Cookie: cookie(sid) } } : undefined,
  );

  const res = await fetch(req);
  if (isErr(res)) return res;

  return mapAsyncForResult(
    await mapErrAsyncForResult(
      responseIntoResult(unwrapOk(res)),
      async (error) =>
        (await parseHTTPError(error, [
          "NotFoundError",
          "NotLoggedInError",
          "NotMemberError",
        ])) ?? error,
    ),
    (res) => res.json() as Promise<PageSnapshotList>,
  );
};
