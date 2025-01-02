import type {
  BadRequestError,
  InvalidURLError,
  NoQueryError,
  NotFoundError,
  NotLoggedInError,
  NotMemberError,
  NotPrivilegeError,
  SessionError,
} from "@cosense/types/rest";

export type RESTError =
  | BadRequestError
  | NotFoundError
  | NotLoggedInError
  | NotMemberError
  | SessionError
  | InvalidURLError
  | NoQueryError
  | NotPrivilegeError;
