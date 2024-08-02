import { createErr, createOk, type Result } from "option-t/plain_result";

export interface HTTPError {
  name: "HTTPError";
  message: string;
  response: Response;
}

export const responseIntoResult = (
  response: Response,
): Result<Response, HTTPError> =>
  !response.ok
    ? createErr({
      name: "HTTPError",
      message: `${response.status} ${response.statusText}`,
      response,
    })
    : createOk(response);
