import type {
  NotFoundError,
  NotLoggedInError,
  NotMemberError,
} from "../deps/scrapbox-rest.ts";
import { cookie } from "./auth.ts";
import { makeError } from "./error.ts";
import { encodeTitleURI } from "../title.ts";
import { BaseOptions, Result, setDefaults } from "./util.ts";

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
  if (!res.ok) {
    if (res.status === 404) {
      // responseが空文字の時があるので、自前で組み立てる
      return {
        ok: false,
        value: {
          name: "NotFoundError",
          message: "Table not found.",
        },
      };
    }
    return makeError<NotLoggedInError | NotMemberError>(res);
  }
  return { ok: true, value: await res.text() };
};

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
      NotFoundError | NotLoggedInError | NotMemberError
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
      NotFoundError | NotLoggedInError | NotMemberError
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
  return await getTable_fromResponse(res);
};

getTable.toRequest = getTable_toRequest;
getTable.fromResponse = getTable_fromResponse;
