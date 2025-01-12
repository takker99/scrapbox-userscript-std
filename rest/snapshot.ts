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

/** Error that occurs when an invalid `timestampId` is provided to {@linkcode getSnapshot} */
export interface InvalidPageSnapshotIdError extends ErrorLike {
  name: "InvalidPageSnapshotIdError";
}

export type SnapshotError =
  | NotFoundError
  | NotLoggedInError
  | NotMemberError
  | InvalidPageSnapshotIdError
  | HTTPError;

/** get a page snapshot
 *
 * @param options `connect.sid` etc.
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

export type SnapshotTimestampIdsError =
  | NotFoundError
  | NotLoggedInError
  | NotMemberError
  | HTTPError;

/**
 * Retrieves the timestamp IDs for a specific page in a project.
 *
 * @param project - The name of the project.
 * @param pageId - The ID of the page.
 * @param options - Optional configuration options.
 * @returns A promise that resolves to a {@linkcode Result} object containing the page snapshot list if successful,
 * or an error if the request fails.
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
