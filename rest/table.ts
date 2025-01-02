import type {
  NotFoundError,
  NotLoggedInError,
  NotMemberError,
} from "@cosense/types/rest";
import { cookie } from "./auth.ts";
import { encodeTitleURI } from "../title.ts";
import { type BaseOptions, setDefaults } from "./options.ts";
import { ScrapboxResponse } from "./response.ts";
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

const getTable_fromResponse: GetTable["fromResponse"] = async (res) => {
  const response = ScrapboxResponse.from<string, TableError>(res);

  if (response.status === 404) {
    // Build our own error message since the response might be empty
    return ScrapboxResponse.error({
      name: "NotFoundError",
      message: "Table not found.",
    });
  }

  await parseHTTPError(response, [
    "NotLoggedInError",
    "NotMemberError",
  ]);

  if (response.ok) {
    const text = await response.text();
    return ScrapboxResponse.ok(text);
  }

  return response;
};

export type TableError =
  | NotFoundError
  | NotLoggedInError
  | NotMemberError
  | HTTPError;

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
  fromResponse: (res: Response) => Promise<ScrapboxResponse<string, TableError>>;

  (
    project: string,
    title: string,
    filename: string,
    options?: BaseOptions,
  ): Promise<ScrapboxResponse<string, TableError | FetchError>>;
}

/** 指定したテーブルをCSV形式で得る
 *
 * @param project 取得したいページのproject名
 * @param title 取得したいページのtitle 大文字小文字は問わない
 * @param filename テーブルの名前
 * @param options オプション
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
    return getTable_fromResponse(res);
  };

  fn.toRequest = getTable_toRequest;
  fn.fromResponse = getTable_fromResponse;

  return fn;
})();
