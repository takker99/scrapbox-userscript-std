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
import type { StatusCode } from "jsr:@std/http";

/**
 * Represents an HTTP error with status code and message
 */
export interface HTTPError {
  status: StatusCode;
  statusText: string;
  message?: string;
}

export type RESTError =
  | BadRequestError
  | NotFoundError
  | NotLoggedInError
  | NotMemberError
  | SessionError
  | InvalidURLError
  | NoQueryError
  | NotPrivilegeError
  | HTTPError;
