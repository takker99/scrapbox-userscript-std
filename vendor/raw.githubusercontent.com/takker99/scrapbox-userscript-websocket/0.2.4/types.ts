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

export interface ProjectUpdatesStreamCommit {
  kind: "page";
  id: string;
  parentId: string;
  projectId: string;
  pageId: string;
  userId: string;
  changes:
    | (
      | InsertChange
      | UpdateChange
      | DeleteChange
      | TitleChange
      | LinksChange
      | IconsChange
    )[]
    | [DeletePageChange];
  cursor: null;
  freeze: true;
}

export type ProjectUpdatesStreamEvent =
  | MemberJoinEvent
  | InvitationResetEvent
  | PageDeleteEvent
  | AdminAddEvent
  | AdminDeleteEvent
  | OwnerSetEvent;

export interface ProjectEvent {
  id: string;
  pageId: string;
  userId: string;
  projectId: string;
  created: number;
  updated: number;
}

export interface PageDeleteEvent extends ProjectEvent {
  type: "page.delete";
  data: {
    titleLc: string;
  };
}

export interface MemberJoinEvent extends ProjectEvent {
  type: "member.join";
}
export interface InvitationResetEvent extends ProjectEvent {
  type: "invitation.reset";
}
export interface AdminAddEvent extends ProjectEvent {
  type: "admin.add";
  targetUserId: string;
}
export interface AdminDeleteEvent extends ProjectEvent {
  type: "admin.delete";
  targetUserId: string;
}
export interface OwnerSetEvent extends ProjectEvent {
  type: "owner.set";
  targetUserId: string;
}

export interface CommitNotification extends PageCommit {
  id: string;
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

export interface ErrorLike {
  name: string;
}

export interface UnexpectedError {
  name: "UnexpectedError";
  value: unknown;
}
export interface TimeoutError {
  name: "TimeoutError";
  message: string;
}

export type PageCommitError =
  | SocketIOError
  | DuplicateTitleError
  | NotFastForwardError;

/* the error that occurs when the socket.io causes an error
*
* when this error occurs, wait for a while and retry the request
*/
export interface SocketIOError {
  name: "SocketIOError";
}
/** the error that occurs when the title is already in use */
export interface DuplicateTitleError {
  name: "DuplicateTitleError";
}
/** the error caused when commitId is not latest */
export interface NotFastForwardError {
  name: "NotFastForwardError";
}

export const isPageCommitError = (error: ErrorLike): error is PageCommitError =>
  pageCommitErrorNames.includes(error.name);

const pageCommitErrorNames = [
  "SocketIOError",
  "DuplicateTitleError",
  "NotFastForwardError",
];

export type Result<T, E = unknown> =
  | { ok: true; value: T }
  | { ok: false; value: E };

export interface EventMap {
  "socket.io-request": (
    req: { method: "commit"; data: PageCommit } | {
      method: "room:join";
      data: JoinRoomRequest;
    },
    success: PageCommitResponse | JoinRoomResponse,
    failed: PageCommitError,
  ) => void;
  cursor: (
    req: Omit<MoveCursorData, "socketId">,
    success: undefined,
    failed: unknown,
  ) => void;
}
export interface ListenEventMap {
  "projectUpdatesStream:commit": ProjectUpdatesStreamCommit;
  "projectUpdatesStream:event": ProjectUpdatesStreamEvent;
  commit: CommitNotification;
  cursor: MoveCursorData;
  "quick-search:commit": QuickSearchCommit;
  "quick-search:replace-link": QuickSearchReplaceLink;
  "infobox:updating": boolean;
  "infobox:reload": void;
  "literal-database:reload": void;
}

export interface QuickSearchCommit extends Omit<CommitNotification, "changes"> {
  changes:
    | (TitleChange | LinksChange | DescriptionsChange | ImageChange)[]
    | [DeletePageChange];
}

export interface QuickSearchReplaceLink {
  from: string;
  to: string;
}

export type DataOf<Event extends keyof EventMap> = Parameters<
  EventMap[Event]
>[0];
export type SuccessResOf<Event extends keyof EventMap> = Parameters<
  EventMap[Event]
>[1];
export type FailedResOf<Event extends keyof EventMap> = Parameters<
  EventMap[Event]
>[2];

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

export type Change =
  | InsertChange
  | UpdateChange
  | DeleteChange
  | LinksChange
  | ProjectLinksChange
  | IconsChange
  | DescriptionsChange
  | ImageChange
  | FilesChange
  | HelpFeelsChange
  | infoboxDefinitionChange
  | TitleChange;
export interface InsertChange {
  _insert: string;
  lines: {
    id: string;
    text: string;
  };
}
export interface UpdateChange {
  _update: string;
  lines: {
    text: string;
  };
  noTimestampUpdate?: unknown;
}
export interface DeleteChange {
  _delete: string;
  lines: -1;
}
export interface LinksChange {
  links: string[];
}
export interface ProjectLinksChange {
  projectLinks: string[];
}
export interface IconsChange {
  icons: string[];
}
export interface DescriptionsChange {
  descriptions: string[];
}
export interface ImageChange {
  image: string | null;
}
export interface TitleChange {
  title: string;
}
export interface FilesChange {
  /** file id */
  files: string[];
}
export interface HelpFeelsChange {
  /** Helpfeel記法の先頭の`? `をとったもの */
  helpfeels: string[];
}
export interface infoboxDefinitionChange {
  /** `table:infobox`または`table:cosense`の各行をtrimしたもの */
  infoboxDefinition: string[];
}
export interface PinChange {
  pin: number;
}
export interface DeletePageChange {
  deleted: true;
  merged?: true;
}
