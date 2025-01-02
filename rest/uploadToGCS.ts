import { cookie, getCSRFToken } from "./auth.ts";
import {
  type BaseOptions,
  type ExtendedOptions,
  setDefaults,
} from "./options.ts";
import type { ErrorLike, NotFoundError } from "@cosense/types/rest";
import { md5 } from "@takker/md5";
import { encodeHex } from "@std/encoding/hex";
import {
  createOk,
  isErr,
  mapAsyncForResult,
  mapErrAsyncForResult,
  mapForResult,
  orElseAsyncForResult,
  type Result,
  unwrapOk,
} from "option-t/plain_result";
import { toResultOkFromMaybe } from "option-t/maybe";
import type { FetchError } from "./robustFetch.ts";
import { type HTTPError, responseIntoResult } from "./responseIntoResult.ts";

/** Metadata for the uploaded file */
export interface GCSFile {
  /** URL of the uploaded file */
  embedUrl: string;

  /** Original name of the uploaded file */
  originalName: string;
}

export type UploadGCSError =
  | GCSError
  | NotFoundError
  | FileCapacityError
  | HTTPError;

/** Upload any file to scrapbox.io
 *
 * @param file File to upload
 * @param projectId ID of the target project
 * @return On success, returns the file's cloud URL and other metadata
 */
export const uploadToGCS = async (
  file: File,
  projectId: string,
  options?: ExtendedOptions,
): Promise<Result<GCSFile, UploadGCSError | FetchError>> => {
  const md5Hash = `${encodeHex(md5(await file.arrayBuffer()))}`;
  const res = await uploadRequest(file, projectId, md5Hash, options);
  if (isErr(res)) return res;
  const fileOrRequest = unwrapOk(res);
  if ("embedUrl" in fileOrRequest) return createOk(fileOrRequest);
  const result = await upload(fileOrRequest.signedUrl, file, options);
  if (isErr(result)) return result;
  return verify(projectId, fileOrRequest.fileId, md5Hash, options);
};

/** Error that occurs when storage capacity is exceeded */
export interface FileCapacityError extends ErrorLike {
  name: "FileCapacityError";
}

interface UploadRequest {
  /** Signed URL for uploading the file */
  signedUrl: string;

  /** File ID that will be associated with the uploaded file */
  fileId: string;
}

/** Request file upload authorization
 *
 * @param file File to upload
 * @param projectId ID of the target project
 * @param md5 MD5 hash of the file (hexadecimal)
 * @return Returns file URL if already uploaded, or upload destination URL if not
 */
const uploadRequest = async (
  file: File,
  projectId: string,
  md5: string,
  init?: ExtendedOptions,
): Promise<
  Result<GCSFile | UploadRequest, FileCapacityError | FetchError | HTTPError>
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

/** Google Cloud Storage XML API error
 *
 * The `message` field contains XML in [this format](https://cloud.google.com/storage/docs/xml-api/reference-status#http-status-and-error-codes)
 */
export interface GCSError extends ErrorLike {
  name: "GCSError";
}

/** Upload the file to storage */
const upload = async (
  signedUrl: string,
  file: File,
  init?: BaseOptions,
): Promise<Result<undefined, GCSError | FetchError | HTTPError>> => {
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

/** Verify the integrity of the uploaded file */
const verify = async (
  projectId: string,
  fileId: string,
  md5: string,
  init?: ExtendedOptions,
): Promise<Result<GCSFile, NotFoundError | FetchError | HTTPError>> => {
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
