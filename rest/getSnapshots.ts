import type {
  ErrorLike,
  NotFoundError,
  NotLoggedInError,
  NotMemberError,
  PageSnapshot,
  Snapshot,
} from "../deps/scrapbox-rest.ts";
import { tryToErrorLike } from "../is.ts";
import { cookie } from "./auth.ts";
import { BaseOptions, Result, setDefaults } from "./util.ts";
import { UnexpectedResponseError } from "./error.ts";

/** 不正なfollowingIdを渡されたときに発生するエラー */
export interface InvalidPageSnapshotIdError extends ErrorLike {
  name: "InvalidPageSnapshotIdError";
}

export interface GetSnapshotsOptions extends BaseOptions {
  /** 次のsnapshots listを示すID */
  followingId?: string;
}

/** get page snapshots
 *
 * @param options connect.sid etc.
 */
export const getSnapshots = async (
  project: string,
  pageId: string,
  options?: GetSnapshotsOptions,
): Promise<
  Result<
    (PageSnapshot & { followingId: string }),
    | NotFoundError
    | NotLoggedInError
    | NotMemberError
    | InvalidPageSnapshotIdError
  >
> => {
  const { sid, hostName, fetch, followingId } = setDefaults(options ?? {});
  const path = `https://${hostName}/api/page-snapshots/${project}/${pageId}/${
    followingId ? `?followingId=${followingId}` : ""
  }`;

  const res = await fetch(
    path,
    sid ? { headers: { Cookie: cookie(sid) } } : undefined,
  );

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
      value: value as (NotFoundError | NotLoggedInError | NotMemberError),
    };
  }

  const data = (await res.json()) as PageSnapshot;
  return {
    ok: true,
    value: { ...data, followingId: res.headers.get("X-following-id") ?? "" },
  };
};

/** 指定したページのsnapshotsを、responseに入っている塊ごとに全て返す
 *
 * @param project ページのproject name
 * @param pageId page id
 * @return 認証が通らなかったらエラーを、通ったらasync generatorを返す
 */
export const readSnapshotsBulk = async (
  project: string,
  pageId: string,
  options?: BaseOptions,
): Promise<
  | NotFoundError
  | NotLoggedInError
  | NotMemberError
  | InvalidPageSnapshotIdError
  | AsyncGenerator<Snapshot[], void, unknown>
> => {
  const first = await getSnapshots(project, pageId, options);
  if (!first.ok) return first.value;

  return async function* () {
    yield first.value.snapshots;
    let followingId = first.value.followingId;

    while (followingId) {
      const result = await getSnapshots(project, pageId, {
        followingId,
        ...options,
      });

      // すでに認証は通っているので、ここでエラーになるはずがない
      if (!result.ok) {
        throw new Error("The authorization cannot be unavailable");
      }
      yield result.value.snapshots;
      followingId = result.value.followingId;
    }
  }();
};

/** 指定したページの全てのsnapshotsを取得し、一つづつ返す
 *
 * @param project ページのproject name
 * @param pageId page id
 * @return 認証が通らなかったらエラーを、通ったらasync generatorを返す
 */
export const readSnapshots = async (
  project: string,
  pageId: string,
  options?: BaseOptions,
): Promise<
  | NotFoundError
  | NotLoggedInError
  | NotMemberError
  | InvalidPageSnapshotIdError
  | AsyncGenerator<Snapshot, void, unknown>
> => {
  const reader = await readSnapshotsBulk(project, pageId, options);
  if ("name" in reader) return reader;

  return async function* () {
    for await (const titles of reader) {
      for (const title of titles) {
        yield title;
      }
    }
  }();
};
