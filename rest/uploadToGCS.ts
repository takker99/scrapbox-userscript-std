import { cookie, getCSRFToken } from "./auth.ts";
import {
  type BaseOptions,
  type ExtendedOptions,
  type Result,
  setDefaults,
} from "./util.ts";
import { makeError, UnexpectedResponseError } from "./error.ts";
import type { ErrorLike, NotFoundError } from "../deps/scrapbox-rest.ts";
import { Md5 } from "../deps/hash.ts";

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
  Result<GCSFile, GCSError | NotFoundError | FileCapacityError | ErrorLike>
> => {
  const md5 = new Md5().update(await file.arrayBuffer()).toString();
  const res = await uploadRequest(file, projectId, md5, options);
  if (!res.ok) return res;
  if ("embedUrl" in res.value) return { ok: true, value: res.value };
  const res2 = await upload(res.value.signedUrl, file, options);
  if (!res2.ok) return res2;
  return verify(projectId, res.value.fileId, md5, options);
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
): Promise<Result<GCSFile | UploadRequest, FileCapacityError | ErrorLike>> => {
  const { sid, hostName, fetch, csrf } = setDefaults(init ?? {});
  const body = {
    md5,
    size: file.size,
    contentType: file.type,
    name: file.name,
  };
  const token = csrf ?? await getCSRFToken();
  const req = new Request(
    `https://${hostName}/api/gcs/${projectId}/upload-request`,
    {
      method: "POST",
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json;charset=utf-8",
        "X-CSRF-TOKEN": token,
        ...(sid ? { Cookie: cookie(sid) } : {}),
      },
    },
  );
  const res = await fetch(req);
  if (!res.ok) {
    return makeError(res);
  }
  return { ok: true, value: await res.json() };
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
): Promise<Result<undefined, GCSError>> => {
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
  if (!res.ok) {
    if (res.headers.get("Content-Type")?.includes?.("/xml")) {
      return {
        ok: false,
        value: {
          name: "GCSError",
          message: await res.text(),
        },
      };
    }
    throw new UnexpectedResponseError(res);
  }
  return { ok: true, value: undefined };
};

/** uploadしたファイルの整合性を確認する */
const verify = async (
  projectId: string,
  fileId: string,
  md5: string,
  init?: ExtendedOptions,
): Promise<Result<GCSFile, NotFoundError>> => {
  const { sid, hostName, fetch, csrf } = setDefaults(init ?? {});
  const token = csrf ?? await getCSRFToken();
  const req = new Request(
    `https://${hostName}/api/gcs/${projectId}/verify`,
    {
      method: "POST",
      body: JSON.stringify({ md5, fileId }),
      headers: {
        "Content-Type": "application/json;charset=utf-8",
        "X-CSRF-TOKEN": token,
        ...(sid ? { Cookie: cookie(sid) } : {}),
      },
    },
  );
  const res = await fetch(req);
  if (!res.ok) {
    try {
      if (res.status === 404) {
        return {
          ok: false,
          value: { name: "NotFoundError", message: (await res.json()).message },
        };
      }
    } catch (_) {
      throw new UnexpectedResponseError(res);
    }
    throw new UnexpectedResponseError(res);
  }
  const gcs = await res.json();
  return { ok: true, value: gcs };
};
