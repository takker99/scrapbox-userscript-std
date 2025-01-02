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
import { ScrapboxResponse } from "./response.ts";
import type { FetchError } from "./mod.ts";

/** 不正な`timestampId`を渡されたときに発生するエラー */
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
 * @param options connect.sid etc.
 */
export const getSnapshot = async (
  project: string,
  pageId: string,
  timestampId: string,
  options?: BaseOptions,
): Promise<ScrapboxResponse<PageSnapshotResult, SnapshotError | FetchError>> => {
  const { sid, hostName, fetch } = setDefaults(options ?? {});

  const req = new Request(
    `https://${hostName}/api/page-snapshots/${project}/${pageId}/${timestampId}`,
    sid ? { headers: { Cookie: cookie(sid) } } : undefined,
  );

  const res = await fetch(req);
  const response = ScrapboxResponse.from<PageSnapshotResult, SnapshotError>(res);

  if (response.status === 422) {
    return ScrapboxResponse.error({
      name: "InvalidPageSnapshotIdError",
      message: await response.text(),
    });
  }

  await parseHTTPError(response, [
    "NotFoundError",
    "NotLoggedInError",
    "NotMemberError",
  ]);

  return response;
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
 * @returns A promise that resolves to a {@link Result} object containing the page snapshot list if successful,
 * or an error if the request fails.
 */
export const getTimestampIds = async (
  project: string,
  pageId: string,
  options?: BaseOptions,
): Promise<
  ScrapboxResponse<PageSnapshotList, SnapshotTimestampIdsError | FetchError>
> => {
  const { sid, hostName, fetch } = setDefaults(options ?? {});

  const req = new Request(
    `https://${hostName}/api/page-snapshots/${project}/${pageId}`,
    sid ? { headers: { Cookie: cookie(sid) } } : undefined,
  );

  const res = await fetch(req);
  const response = ScrapboxResponse.from<PageSnapshotList, SnapshotTimestampIdsError>(res);

  await parseHTTPError(response, [
    "NotFoundError",
    "NotLoggedInError",
    "NotMemberError",
  ]);

  return response;
};
