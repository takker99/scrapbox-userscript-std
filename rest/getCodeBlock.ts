import type {
  NotFoundError,
  NotLoggedInError,
  NotMemberError,
} from "../deps/scrapbox-rest.ts";
import { cookie } from "./auth.ts";
import { makeError } from "./error.ts";
import { encodeTitleURI } from "../title.ts";
import { BaseOptions, Result, setDefaults } from "./util.ts";

const getCodeBlock_toRequest: GetCodeBlock["toRequest"] = (
  project,
  title,
  filename,
  options,
) => {
  const { sid, hostName } = setDefaults(options ?? {});
  const path = `https://${hostName}/api/code/${project}/${
    encodeTitleURI(title)
  }/${encodeTitleURI(filename)}`;

  return new Request(
    path,
    sid ? { headers: { Cookie: cookie(sid) } } : undefined,
  );
};

const getCodeBlock_fromResponse: GetCodeBlock["fromResponse"] = async (res) => {
  if (!res.ok) {
    return res.status === 404 &&
        res.headers.get("Content-Type")?.includes?.("text/plain")
      ? {
        ok: false,
        value: { name: "NotFoundError", message: "Code block is not found" },
      }
      : makeError<NotFoundError | NotLoggedInError | NotMemberError>(res);
  }
  return { ok: true, value: await res.text() };
};

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
  const { fetch } = setDefaults(options ?? {});
  const req = getCodeBlock_toRequest(project, title, filename, options);
  const res = await fetch(req);
  return await getCodeBlock_fromResponse(res);
};

getCodeBlock.toRequest = getCodeBlock_toRequest;
getCodeBlock.fromResponse = getCodeBlock_fromResponse;
