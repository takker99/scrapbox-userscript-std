import type {
  ErrorLike,
  NotFoundError,
  NotLoggedInError,
  NotMemberError,
  PageSnapshotList,
  PageSnapshotResult,
} from "../deps/scrapbox-rest.ts";
import { cookie } from "./auth.ts";
import { BaseOptions, Result, setDefaults } from "./util.ts";
import { makeError } from "./error.ts";

/** 不正な`timestampId`を渡されたときに発生するエラー */
export interface InvalidPageSnapshotIdError extends ErrorLike {
  name: "InvalidPageSnapshotIdError";
}

/** get a page snapshot
 *
 * @param options connect.sid etc.
 */
export const getSnapshot = async (
  project: string,
  pageId: string,
  timestampId: string,
  options?: BaseOptions,
): Promise<
  Result<
    PageSnapshotResult,
    | NotFoundError
    | NotLoggedInError
    | NotMemberError
    | InvalidPageSnapshotIdError
  >
> => {
  const { sid, hostName, fetch } = setDefaults(options ?? {});

  const req = new Request(
    `https://${hostName}/api/page-snapshots/${project}/${pageId}/${timestampId}`,
    sid ? { headers: { Cookie: cookie(sid) } } : undefined,
  );

  const res = await fetch(req);

  if (!res.ok) {
    if (res.status === 422) {
      return {
        ok: false,
        value: {
          name: "InvalidPageSnapshotIdError",
          message: await res.text(),
        },
      };
    }
    return makeError<NotFoundError | NotLoggedInError | NotMemberError>(res);
  }

  const value = (await res.json()) as PageSnapshotResult;
  return { ok: true, value };
};

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
  Result<PageSnapshotList, NotFoundError | NotLoggedInError | NotMemberError>
> => {
  const { sid, hostName, fetch } = setDefaults(options ?? {});

  const req = new Request(
    `https://${hostName}/api/page-snapshots/${project}/${pageId}`,
    sid ? { headers: { Cookie: cookie(sid) } } : undefined,
  );

  const res = await fetch(req);

  if (!res.ok) {
    return makeError<NotFoundError | NotLoggedInError | NotMemberError>(res);
  }

  const value = (await res.json()) as PageSnapshotList;
  return { ok: true, value };
};
