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
  /** /api/code/:project/:title/:filename の要求を組み立てる
   *
   * @param project 取得したいページのproject名
   * @param title 取得したいページのtitle 大文字小文字は問わない
   * @param filename 取得したいコードブロックのファイル名
   * @param options オプション
   * @return request
   */
  toRequest: (
    project: string,
    title: string,
    filename: string,
    options?: BaseOptions,
  ) => Request;

  /** 帰ってきた応答からコードを取得する
   *
   * @param res 応答
   * @return コード
   */
  fromResponse: (res: Response) => Promise<
    Result<
      string,
      NotFoundError | NotLoggedInError | NotMemberError | HTTPError
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

/** 指定したコードブロック中のテキストを取得する
 *
 * @param project 取得したいページのproject名
 * @param title 取得したいページのtitle 大文字小文字は問わない
 * @param filename 取得したいコードブロックのファイル名
 * @param options オプション
 */
export const getCodeBlock: GetCodeBlock = async (
  project,
  title,
  filename,
  options,
) => {
  const req = getCodeBlock_toRequest(project, title, filename, options);
  const res = await setDefaults(options ?? {}).fetch(req);
  return isErr(res) ? res : getCodeBlock_fromResponse(unwrapOk(res));
};

getCodeBlock.toRequest = getCodeBlock_toRequest;
getCodeBlock.fromResponse = getCodeBlock_fromResponse;
