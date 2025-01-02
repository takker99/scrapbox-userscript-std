import type {
  NotFoundError,
  NotLoggedInError,
  NotMemberError,
} from "@cosense/types/rest";
import { cookie } from "./auth.ts";
import { encodeTitleURI } from "../title.ts";
import { type BaseOptions, setDefaults } from "./options.ts";
import {
  isErr,
  mapAsyncForResult,
  mapErrAsyncForResult,
  type Result,
  unwrapOk,
} from "option-t/plain_result";
import { type HTTPError, responseIntoResult } from "./responseIntoResult.ts";
import { parseHTTPError } from "./parseHTTPError.ts";
import type { FetchError } from "./mod.ts";

const getCodeBlock_toRequest: GetCodeBlock["toRequest"] = (
  project,
  title,
  filename,
  options,
) => {
  const { sid, hostName } = setDefaults(options ?? {});

  return new Request(
    `https://${hostName}/api/code/${project}/${encodeTitleURI(title)}/${
      encodeTitleURI(filename)
    }`,
    sid ? { headers: { Cookie: cookie(sid) } } : undefined,
  );
};

const getCodeBlock_fromResponse: GetCodeBlock["fromResponse"] = async (res) =>
  mapAsyncForResult(
    await mapErrAsyncForResult(
      responseIntoResult(res),
      async (res) =>
        res.response.status === 404 &&
          res.response.headers.get("Content-Type")?.includes?.("text/plain")
          ? { name: "NotFoundError", message: "Code block is not found" }
          : (await parseHTTPError(res, [
            "NotLoggedInError",
            "NotMemberError",
          ])) ?? res,
    ),
    (res) => res.text(),
  );

export interface GetCodeBlock {
  /** Build a request to fetch a code block from /api/code/:project/:title/:filename
   *
   * This method constructs a Request object to fetch the content of a code block
   * from Scrapbox. A code block is a section of code in a Scrapbox page that is
   * formatted as a distinct block, typically used for storing code snippets,
   * configuration files, or other structured text.
   *
   * @param project - The name of the Scrapbox project containing the page
   * @param title - The title of the page containing the code block
   *               (case-insensitive)
   * @param filename - The name of the code block file as it appears in the page
   * @param options - Optional configuration for the request:
   *                 - sid: Session ID for authenticated requests
   *                 - hostName: Custom hostname for the Scrapbox instance
   * @returns A Request object configured to fetch the code block
   *
   * @example
   * ```typescript
   * const request = getCodeBlock.toRequest(
   *   "myproject",
   *   "My Page",
   *   "example.js",
   *   { sid: "session-id" }
   * );
   * ```
   */
  toRequest: (
    project: string,
    title: string,
    filename: string,
    options?: BaseOptions,
  ) => Request;

  /** Extract code content from the API response
   *
   * This method processes the Response from the Scrapbox API and handles various
   * error cases that might occur when fetching a code block:
   * - NotFoundError: The code block doesn't exist
   * - NotLoggedInError: Authentication is required but not provided
   * - NotMemberError: User doesn't have access to the project
   * - HTTPError: Other HTTP-related errors
   *
   * @param res - The Response object from the API request
   * @returns A Result containing either:
   *          - Success: The code block content as a string
   *          - Error: One of the error types defined in CodeBlockError
   *
   * @example
   * ```typescript
   * const response = await fetch(request);
   * const result = await getCodeBlock.fromResponse(response);
   * if (result.ok) {
   *   console.log("Code content:", result.val);
   * } else {
   *   console.error("Error:", result.err);
   * }
   * ```
   */
  fromResponse: (res: Response) => Promise<Result<string, CodeBlockError>>;

  (
    project: string,
    title: string,
    filename: string,
    options?: BaseOptions,
  ): Promise<Result<string, CodeBlockError | FetchError>>;
}
export type CodeBlockError =
  | NotFoundError
  | NotLoggedInError
  | NotMemberError
  | HTTPError;

/** Fetch the content of a specific code block from a Scrapbox page
 *
 * This function provides a high-level interface to retrieve code block content
 * from Scrapbox pages. It combines the functionality of toRequest and
 * fromResponse into a single convenient method. The function handles:
 * - Request construction with proper URL encoding
 * - Authentication via session ID (if provided)
 * - Error handling for various failure cases
 * - Response parsing and content extraction
 *
 * @param project - The name of the Scrapbox project containing the page
 * @param title - The title of the page containing the code block
 *               (case-insensitive)
 * @param filename - The name of the code block file as it appears in the page
 * @param options - Optional configuration:
 *                 - sid: Session ID for authenticated requests
 *                 - hostName: Custom hostname for the Scrapbox instance
 *                 - fetch: Custom fetch function for making requests
 * @returns A Result containing either:
 *          - Success: The code block content as a string
 *          - Error: A FetchError or one of the CodeBlockError types
 *
 * @example
 * ```typescript
 * const result = await getCodeBlock(
 *   "myproject",
 *   "My Page",
 *   "example.js",
 *   { sid: "session-id" }
 * );
 * 
 * if (result.ok) {
 *   // Success case
 *   console.log("Code content:", result.val);
 * } else {
 *   // Error handling based on error type
 *   switch (result.err.name) {
 *     case "NotFoundError":
 *       console.error("Code block not found");
 *       break;
 *     case "NotLoggedInError":
 *       console.error("Authentication required");
 *       break;
 *     case "NotMemberError":
 *       console.error("No access to project");
 *       break;
 *     default:
 *       console.error("Other error:", result.err);
 *   }
 * }
 * ```
 */
export const getCodeBlock: GetCodeBlock = /* @__PURE__ */ (() => {
  const fn: GetCodeBlock = async (
    project,
    title,
    filename,
    options,
  ) => {
    const req = getCodeBlock_toRequest(project, title, filename, options);
    const res = await setDefaults(options ?? {}).fetch(req);
    return isErr(res) ? res : getCodeBlock_fromResponse(unwrapOk(res));
  };

  fn.toRequest = getCodeBlock_toRequest;
  fn.fromResponse = getCodeBlock_fromResponse;

  return fn;
})();
