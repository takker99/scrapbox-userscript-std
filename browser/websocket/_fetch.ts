import {
  Change,
  CommitNotification,
  DeletePageChange,
  PageCommitError,
  PageCommitResponse,
  PinChange,
  ProjectUpdatesStreamCommit,
  ProjectUpdatesStreamEvent,
  Result,
  TimeoutError,
  UnexpectedError,
  wrap,
} from "../../deps/socket.ts";
import { pull } from "./pull.ts";
export type {
  CommitNotification,
  ProjectUpdatesStreamCommit,
  ProjectUpdatesStreamEvent,
};

export type RequestFunc = ReturnType<typeof wrap>["request"];
export type PushCommitInit = {
  parentId: string;
  projectId: string;
  pageId: string;
  userId: string;
};

export const pushCommit = (
  request: RequestFunc,
  changes: Change[] | [DeletePageChange] | [PinChange],
  commitInit: PushCommitInit,
): Promise<
  Result<
    PageCommitResponse,
    UnexpectedError | TimeoutError | PageCommitError
  >
> =>
  changes.length === 0
    ? Promise.resolve({ ok: true, value: { commitId: commitInit.parentId } })
    : request("socket.io-request", {
      method: "commit",
      data: {
        kind: "page",
        ...commitInit,
        changes,
        cursor: null,
        freeze: true,
      },
    }) as Promise<
      Result<
        PageCommitResponse,
        UnexpectedError | TimeoutError | PageCommitError
      >
    >;

export const pushWithRetry = async (
  request: RequestFunc,
  changes: Change[] | [DeletePageChange] | [PinChange],
  { project, title, retry = 3, parentId, ...commitInit }:
    & PushCommitInit
    & {
      project: string;
      title: string;
      retry?: number;
    },
) => {
  try {
    const res = await pushCommit(request, changes, {
      parentId,
      ...commitInit,
    });
    if (!res.ok) throw Error("Faild to push a commit");
    parentId = res.value.commitId;
  } catch (_) {
    console.log("Faild to push a commit. Retry after pulling new commits");
    for (let i = 0; i < retry; i++) {
      const { commitId } = await pull(project, title);
      parentId = commitId;
      try {
        const res = await pushCommit(request, changes, {
          parentId,
          ...commitInit,
        });
        if (!res.ok) throw Error("Faild to push a commit");
        parentId = res.value.commitId;
        console.log("Success in retrying");
        break;
      } catch (_) {
        continue;
      }
    }
    throw Error("Faild to retry pushing.");
  }
  return parentId;
};
