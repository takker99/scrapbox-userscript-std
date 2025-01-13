import { createErr, createOk, type Result } from "option-t/plain_result";

/**
 * Represents an HTTP error response with status code and message.
 *
 * @property name - Always "HTTPError" to identify the error type
 * @property message - A string containing the HTTP status code and status text
 * @property response - The original {@linkcode Response} object that caused the error
 */
export interface HTTPError {
  name: "HTTPError";
  message: string;
  response: Response;
}

/**
 * Converts a {@linkcode Response} into a {@linkcode Result} type, handling HTTP errors.
 *
 * @param response - The {@linkcode Response} object to convert into a {@linkcode Result}
 * @returns A {@linkcode Result}<{@linkcode Response}, {@linkcode HTTPError}> containing either:
 *          - Success: The original {@linkcode Response} if status is ok (2xx)
 *          - Error: A {@linkcode HTTPError} containing:
 *            - status code and status text as message
 *            - original {@linkcode Response} object for further processing
 */
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
