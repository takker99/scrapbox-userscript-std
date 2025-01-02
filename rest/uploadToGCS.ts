import { cookie, getCSRFToken } from "./auth.ts";
import {
  type BaseOptions,
  type ExtendedOptions,
  setDefaults,
} from "./options.ts";
import type { ErrorLike, NotFoundError } from "@cosense/types/rest";
import { md5 } from "@takker/md5";
import { encodeHex } from "@std/encoding/hex";
import type { FetchError } from "./robustFetch.ts";
import type { TargetedResponse } from "./targeted_response.ts";
import {
  createErrorResponse,
  createSuccessResponse,
  createTargetedResponse,
} from "./utils.ts";

/** uploadしたファイルのメタデータ */
export interface GCSFile {
  /** uploadしたファイルのURL */
  embedUrl: string;

  /** uploadしたファイルの名前 */
  originalName: string;
}

export type UploadGCSError =
  | GCSError
  | NotFoundError
  | FileCapacityError
  | HTTPError;

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
  TargetedResponse<200 | 400 | 402 | 404, GCSFile | UploadGCSError | FetchError>
> => {
  const md5Hash = `${encodeHex(md5(await file.arrayBuffer()))}`;
  const res = await uploadRequest(file, projectId, md5Hash, options);
  if (!res.ok) return res;
  const fileOrRequest = res.data;
  if ("embedUrl" in fileOrRequest) return createSuccessResponse(fileOrRequest);
  const result = await upload(fileOrRequest.signedUrl, file, options);
  if (!result.ok) return result;
  return verify(projectId, fileOrRequest.fileId, md5Hash, options);
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
  ScrapboxResponse<
    GCSFile | UploadRequest,
    FileCapacityError | FetchError | HTTPError
  >
> => {
  const { sid, hostName, fetch, csrf } = setDefaults(init ?? {});
  const body = {
    md5,
    size: file.size,
    contentType: file.type,
    name: file.name,
  };

  const csrfToken = csrf ?? await getCSRFToken(init);
  if (!csrfToken.ok) return csrfToken;

  const req = new Request(
    `https://${hostName}/api/gcs/${projectId}/upload-request`,
    {
      method: "POST",
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json;charset=utf-8",
        "X-CSRF-TOKEN": csrfToken.data,
        ...(sid ? { Cookie: cookie(sid) } : {}),
      },
    },
  );

  const res = await fetch(req);
  const response = createTargetedResponse<
    200 | 400 | 402 | 404,
    GCSFile | UploadRequest | FileCapacityError | HTTPError
  >(res);

  if (response.status === 402) {
    const json = await response.json();
    return createErrorResponse(402, {
      name: "FileCapacityError",
      message: json.message,
    } as FileCapacityError);
  }

  return response;
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
  TargetedResponse<
    200 | 400 | 404,
    undefined | GCSError | FetchError | HTTPError
  >
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

  const response = createTargetedResponse<
    200 | 400 | 404,
    undefined | GCSError | HTTPError
  >(res);

  if (
    !response.ok && response.headers.get("Content-Type")?.includes?.("/xml")
  ) {
    return createErrorResponse(400, {
      name: "GCSError",
      message: await response.text(),
    } as GCSError);
  }

  return response.ok ? createSuccessResponse(undefined) : response;
};

/** uploadしたファイルの整合性を確認する */
const verify = async (
  projectId: string,
  fileId: string,
  md5: string,
  init?: ExtendedOptions,
): Promise<
  TargetedResponse<
    200 | 400 | 404,
    GCSFile | NotFoundError | FetchError | HTTPError
  >
> => {
  const { sid, hostName, fetch, csrf } = setDefaults(init ?? {});

  const csrfToken = csrf ?? await getCSRFToken(init);
  if (!csrfToken.ok) return csrfToken;

  const req = new Request(
    `https://${hostName}/api/gcs/${projectId}/verify`,
    {
      method: "POST",
      body: JSON.stringify({ md5, fileId }),
      headers: {
        "Content-Type": "application/json;charset=utf-8",
        "X-CSRF-TOKEN": csrfToken.data,
        ...(sid ? { Cookie: cookie(sid) } : {}),
      },
    },
  );

  const res = await fetch(req);
  const response = createTargetedResponse<
    200 | 400 | 404,
    GCSFile | NotFoundError | HTTPError
  >(res);

  if (response.status === 404) {
    const json = await response.json();
    return createErrorResponse(404, {
      name: "NotFoundError",
      message: json.message,
    } as NotFoundError);
  }

  return response;
};
