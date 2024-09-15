import type { MoveCursorData, PageCommit } from "./emit-events.ts";
import type {
  DeleteChange,
  DeletePageChange,
  DescriptionsChange,
  IconsChange,
  ImageChange,
  InsertChange,
  LinksChange,
  TitleChange,
  UpdateChange,
} from "./change.ts";

export interface ListenEvents {
  "projectUpdatesStream:commit": (event: ProjectUpdatesStreamCommit) => void;
  "projectUpdatesStream:event": (event: ProjectUpdatesStreamEvent) => void;
  commit: (event: CommitNotification) => void;
  cursor: (event: MoveCursorData) => void;
  "quick-search:commit": (event: QuickSearchCommit) => void;
  "quick-search:replace-link": QuickSearchReplaceLink;
  "infobox:updating": boolean;
  "infobox:reload": void;
  "literal-database:reload": void;
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
  | PageDeleteEvent
  | MemberJoinEvent
  | MemberAddEvent
  | AdminAddEvent
  | AdminDeleteEvent
  | OwnerSetEvent
  | InvitationResetEvent;

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
export interface MemberAddEvent extends ProjectEvent {
  type: "member.add";
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

export interface QuickSearchCommit extends Omit<CommitNotification, "changes"> {
  changes:
    | (TitleChange | LinksChange | DescriptionsChange | ImageChange)[]
    | [DeletePageChange];
}

export interface QuickSearchReplaceLink {
  from: string;
  to: string;
}
