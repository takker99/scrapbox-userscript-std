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

const getCodeBlock_fromResponse: GetCodeBlock["fromResponse"] = async (res) => {
  const response = ScrapboxResponse.from<string, CodeBlockError>(res);

  if (response.status === 404 && response.headers.get("Content-Type")?.includes?.("text/plain")) {
    return ScrapboxResponse.error({
      name: "NotFoundError",
      message: "Code block is not found",
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
  fromResponse: (res: Response) => Promise<ScrapboxResponse<string, CodeBlockError>>;

  (
    project: string,
    title: string,
    filename: string,
    options?: BaseOptions,
  ): Promise<ScrapboxResponse<string, CodeBlockError | FetchError>>;
}
export type CodeBlockError =
  | NotFoundError
  | NotLoggedInError
  | NotMemberError
  | HTTPError;

/** 指定したコードブロック中のテキストを取得する
 *
 * @param project 取得したいページのproject名
 * @param title 取得したいページのtitle 大文字小文字は問わない
 * @param filename 取得したいコードブロックのファイル名
 * @param options オプション
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
    return getCodeBlock_fromResponse(res);
  };

  fn.toRequest = getCodeBlock_toRequest;
  fn.fromResponse = getCodeBlock_fromResponse;

  return fn;
})();
