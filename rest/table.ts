import type {
  NotFoundError,
  NotLoggedInError,
  NotMemberError,
} from "@cosense/types/rest";
import { cookie } from "./auth.ts";
import { encodeTitleURI } from "../title.ts";
import { type BaseOptions, setDefaults } from "./util.ts";
import {
  isErr,
  mapAsyncForResult,
  mapErrAsyncForResult,
  type Result,
  unwrapOk,
} from "option-t/plain_result";
import { type HTTPError, responseIntoResult } from "./responseIntoResult.ts";
import { parseHTTPError } from "./parseHTTPError.ts";
import type { AbortError, NetworkError } from "./robustFetch.ts";

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
            // responseが空文字の時があるので、自前で組み立てる
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

export interface GetTable {
  /** /api/table/:project/:title/:filename.csv の要求を組み立てる
   *
   * @param project 取得したいページのproject名
   * @param title 取得したいページのtitle 大文字小文字は問わない
   * @param filename テーブルの名前
   * @param options オプション
   * @return request
   */
  toRequest: (
    project: string,
    title: string,
    filename: string,
    options?: BaseOptions,
  ) => Request;

  /** 帰ってきた応答からページのJSONデータを取得する
   *
   * @param res 応答
   * @return ページのJSONデータ
   */
  fromResponse: (res: Response) => Promise<
    Result<
      string,
      | NotFoundError
      | NotLoggedInError
      | NotMemberError
      | NetworkError
      | AbortError
      | HTTPError
    >
  >;

  (
    project: string,
    title: string,
    filename: string,
    options?: BaseOptions,
  ): Promise<
    Result<
      string,
      | NotFoundError
      | NotLoggedInError
      | NotMemberError
      | NetworkError
      | AbortError
      | HTTPError
    >
  >;
}

/** 指定したテーブルをCSV形式で得る
 *
 * @param project 取得したいページのproject名
 * @param title 取得したいページのtitle 大文字小文字は問わない
 * @param filename テーブルの名前
 * @param options オプション
 */
export const getTable: GetTable = async (
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

getTable.toRequest = getTable_toRequest;
getTable.fromResponse = getTable_fromResponse;
