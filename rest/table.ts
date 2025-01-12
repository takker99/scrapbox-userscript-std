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

const getTable_toRequest: GetTable["toRequest"] = (
  project,
  title,
  filename,
  options,
) => {
  const { sid, hostName } = setDefaults(options ?? {});
  const path = `https://${hostName}/api/table/${project}/${
    encodeTitleURI(title)
  }/${encodeURIComponent(filename)}.csv`;

  return new Request(
    path,
    sid ? { headers: { Cookie: cookie(sid) } } : undefined,
  );
};

const getTable_fromResponse: GetTable["fromResponse"] = async (res) =>
  mapAsyncForResult(
    await mapErrAsyncForResult(
      responseIntoResult(res),
      async (error) =>
        error.response.status === 404
          ? {
            // Build error manually since response may be an empty string
            name: "NotFoundError",
            message: "Table not found.",
          }
          : (await parseHTTPError(error, [
            "NotLoggedInError",
            "NotMemberError",
          ])) ?? error,
    ),
    (res) => res.text(),
  );

export type TableError =
  | NotFoundError
  | NotLoggedInError
  | NotMemberError
  | HTTPError;

export interface GetTable {
  /** Build a request for `/api/table/:project/:title/:filename.csv` endpoint
   *
   * @param project Name of the project containing the target page
   * @param title Title of the page (case-insensitive)
   * @param filename Name of the table to retrieve
   * @param options Additional configuration options
   * @return request object
   */
  toRequest: (
    project: string,
    title: string,
    filename: string,
    options?: BaseOptions,
  ) => Request;

  /** Extract page JSON data from the response
   *
   * @param res Response from the server
   * @return Page data in JSON format
   */
  fromResponse: (res: Response) => Promise<Result<string, TableError>>;

  (
    project: string,
    title: string,
    filename: string,
    options?: BaseOptions,
  ): Promise<Result<string, TableError | FetchError>>;
}

/** Retrieve a specified table in CSV format
 *
 * @param project Name of the project containing the target page
 * @param title Title of the page (case-insensitive)
 * @param filename Name of the table to retrieve
 * @param options Additional configuration options
 */
export const getTable: GetTable = /* @__PURE__ */ (() => {
  const fn: GetTable = async (
    project,
    title,
    filename,
    options,
  ) => {
    const { fetch } = setDefaults(options ?? {});
    const req = getTable_toRequest(project, title, filename, options);
    const res = await fetch(req);
    if (isErr(res)) return res;
    return await getTable_fromResponse(unwrapOk(res));
  };

  fn.toRequest = getTable_toRequest;
  fn.fromResponse = getTable_fromResponse;

  return fn;
})();
