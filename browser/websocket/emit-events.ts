import type { Change, DeletePageChange, PinChange } from "./change.ts";

export interface EmitEvents {
  "socket.io-request": (
    req: { method: "commit"; data: PageCommit } | {
      method: "room:join";
      data: JoinRoomRequest;
    },
    callback: (
      res:
        | { data: PageCommitResponse | JoinRoomResponse }
        | { error: { name: string; message?: string } },
    ) => void,
  ) => void;
  cursor: (req: Omit<MoveCursorData, "socketId">) => void;
}

export interface PageCommit {
  kind: "page";
  parentId: string;
  projectId: string;
  pageId: string;
  userId: string;
  changes: Change[] | [PinChange] | [DeletePageChange];
  cursor?: null;
  freeze: true;
}

export interface PageCommitResponse {
  commitId: string;
}

export type JoinRoomRequest =
  | JoinPageRoomRequest
  | JoinProjectRoomRequest
  | JoinStreamRoomRequest;

export interface JoinProjectRoomRequest {
  pageId: null;
  projectId: string;
  projectUpdatesStream: false;
}

export interface JoinPageRoomRequest {
  pageId: string;
  projectId: string;
  projectUpdatesStream: false;
}

export interface JoinStreamRoomRequest {
  pageId: null;
  projectId: string;
  projectUpdatesStream: true;
}

export interface JoinRoomResponse {
  success: true;
  pageId: string | null;
  projectId: string;
}

export interface MoveCursorData {
  user: {
    id: string;
    name: string;
    displayName: string;
  };
  pageId: string;
  position: {
    line: number;
    char: number;
  };
  visible: boolean;
  socketId: string;
}
