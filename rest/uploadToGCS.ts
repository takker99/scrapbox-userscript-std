import { cookie, getCSRFToken } from "./auth.ts";
import { BaseOptions, ExtendedOptions, setDefaults } from "./util.ts";
import type { ErrorLike, NotFoundError } from "../deps/scrapbox-rest.ts";
import { Md5 } from "../deps/hash.ts";
import {
  createOk,
  isErr,
  mapAsyncForResult,
  mapErrAsyncForResult,
  mapForResult,
  orElseAsyncForResult,
  Result,
  toResultOkFromMaybe,
  unwrapOk,
} from "../deps/option-t.ts";
import { AbortError, NetworkError } from "./robustFetch.ts";
import { HTTPError, responseIntoResult } from "./responseIntoResult.ts";

/** uploadしたファイルのメタデータ */
export interface GCSFile {
  /** uploadしたファイルのURL */
  embedUrl: string;

  /** uploadしたファイルの名前 */
  originalName: string;
}

/** 任意のファイルをscrapbox.ioにuploadする
 *
 * @param file uploadしたいファイル
 * @param projectId upload先projectのid
 * @return 成功したら、ファイルのクラウド上のURLなどが返ってくる
 */
export const uploadToGCS = async (
  file: File,
  projectId: string,
  options?: ExtendedOptions,
): Promise<
  Result<
    GCSFile,
    | GCSError
    | NotFoundError
    | FileCapacityError
    | NetworkError
    | AbortError
    | HTTPError
  >
> => {
  const md5 = `${new Md5().update(await file.arrayBuffer())}`;
  const res = await uploadRequest(file, projectId, md5, options);
  if (isErr(res)) return res;
  const fileOrRequest = unwrapOk(res);
  if ("embedUrl" in fileOrRequest) return createOk(fileOrRequest);
  const result = await upload(fileOrRequest.signedUrl, file, options);
  if (isErr(result)) return result;
  return verify(projectId, fileOrRequest.fileId, md5, options);
};

/** 容量を使い切ったときに発生するerror */
export interface FileCapacityError extends ErrorLike {
  name: "FileCapacityError";
}

interface UploadRequest {
  /** upload先URL */
  signedUrl: string;

  /** uploadしたファイルに紐付けられる予定のfile id */
  fileId: string;
}

/** ファイルのuploadを要求する
 *
 * @param file uploadしたいファイル
 * @param projectId upload先projectのid
 * @param md5 uploadしたいファイルのMD5 hash (16進数)
 * @return すでにuploadされていればファイルのURLを、まだの場合はupload先URLを返す
 */
const uploadRequest = async (
  file: File,
  projectId: string,
  md5: string,
  init?: ExtendedOptions,
): Promise<
  Result<
    GCSFile | UploadRequest,
    FileCapacityError | NetworkError | AbortError | HTTPError
  >
> => {
  const { sid, hostName, fetch, csrf } = setDefaults(init ?? {});
  const body = {
    md5,
    size: file.size,
    contentType: file.type,
    name: file.name,
  };
  const csrfResult = await orElseAsyncForResult(
    toResultOkFromMaybe(csrf),
    () => getCSRFToken(init),
  );
  if (isErr(csrfResult)) return csrfResult;
  const req = new Request(
    `https://${hostName}/api/gcs/${projectId}/upload-request`,
    {
      method: "POST",
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json;charset=utf-8",
        "X-CSRF-TOKEN": unwrapOk(csrfResult),
        ...(sid ? { Cookie: cookie(sid) } : {}),
      },
    },
  );
  const res = await fetch(req);
  if (isErr(res)) return res;

  return mapAsyncForResult(
    await mapErrAsyncForResult(
      responseIntoResult(unwrapOk(res)),
      async (error) =>
        error.response.status === 402
          ? {
            name: "FileCapacityError",
            message: (await error.response.json()).message,
          } as FileCapacityError
          : error,
    ),
    (res) => res.json(),
  );
};

/** Google Cloud Storage XML APIのerror
 *
 * `message`には[この形式](https://cloud.google.com/storage/docs/xml-api/reference-status#http-status-and-error-codes)のXMLが入る
 */
export interface GCSError extends ErrorLike {
  name: "GCSError";
}

/** ファイルをuploadする */
const upload = async (
  signedUrl: string,
  file: File,
  init?: BaseOptions,
): Promise<
  Result<undefined, GCSError | NetworkError | AbortError | HTTPError>
> => {
  const { sid, fetch } = setDefaults(init ?? {});
  const res = await fetch(
    signedUrl,
    {
      method: "PUT",
      body: file,
      headers: {
        "Content-Type": file.type,
        ...(sid ? { Cookie: cookie(sid) } : {}),
      },
    },
  );
  if (isErr(res)) return res;

  return mapForResult(
    await mapErrAsyncForResult(
      responseIntoResult(unwrapOk(res)),
      async (error) =>
        error.response.headers.get("Content-Type")?.includes?.("/xml")
          ? {
            name: "GCSError",
            message: await error.response.text(),
          } as GCSError
          : error,
    ),
    () => undefined,
  );
};

/** uploadしたファイルの整合性を確認する */
const verify = async (
  projectId: string,
  fileId: string,
  md5: string,
  init?: ExtendedOptions,
): Promise<
  Result<GCSFile, NotFoundError | NetworkError | AbortError | HTTPError>
> => {
  const { sid, hostName, fetch, csrf } = setDefaults(init ?? {});
  const csrfResult = await orElseAsyncForResult(
    toResultOkFromMaybe(csrf),
    () => getCSRFToken(init),
  );
  if (isErr(csrfResult)) return csrfResult;
  const req = new Request(
    `https://${hostName}/api/gcs/${projectId}/verify`,
    {
      method: "POST",
      body: JSON.stringify({ md5, fileId }),
      headers: {
        "Content-Type": "application/json;charset=utf-8",
        "X-CSRF-TOKEN": unwrapOk(csrfResult),
        ...(sid ? { Cookie: cookie(sid) } : {}),
      },
    },
  );

  const res = await fetch(req);
  if (isErr(res)) return res;

  return mapAsyncForResult(
    await mapErrAsyncForResult(
      responseIntoResult(unwrapOk(res)),
      async (error) =>
        error.response.status === 404
          ? {
            name: "NotFoundError",
            message: (await error.response.json()).message,
          } as NotFoundError
          : error,
    ),
    (res) => res.json(),
  );
};
