import {
  Change,
  CommitNotification,
  Delete,
  Pin,
  ProjectUpdatesStreamCommit,
  ProjectUpdatesStreamEvent,
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

export async function pushCommit(
  request: RequestFunc,
  changes: Change[] | [Delete] | [Pin],
  commitInit: PushCommitInit,
) {
  if (changes.length === 0) return { commitId: commitInit.parentId };
  const res = await request("socket.io-request", {
    method: "commit",
    data: {
      kind: "page",
      ...commitInit,
      changes,
      cursor: null,
      freeze: true,
    },
  });
  return res as { commitId: string };
}

export async function pushWithRetry(
  request: RequestFunc,
  changes: Change[] | [Delete] | [Pin],
  { project, title, retry = 3, parentId, ...commitInit }:
    & PushCommitInit
    & {
      project: string;
      title: string;
      retry?: number;
    },
) {
  try {
    const res = await pushCommit(request, changes, {
      parentId,
      ...commitInit,
    });
    parentId = res.commitId;
  } catch (_e) {
    console.log("Faild to push a commit. Retry after pulling new commits");
    for (let i = 0; i < retry; i++) {
      const { commitId } = await pull(project, title);
      parentId = commitId;
      try {
        const res = await pushCommit(request, changes, {
          parentId,
          ...commitInit,
        });
        parentId = res.commitId;
        console.log("Success in retrying");
        break;
      } catch (_e) {
        continue;
      }
    }
    throw Error("Faild to retry pushing.");
  }
  return parentId;
}
