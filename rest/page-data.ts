import {
  createOk,
  isErr,
  mapAsyncForResult,
  mapErrAsyncForResult,
  type Result,
  unwrapOk,
} from "option-t/plain_result";
import type {
  ExportedData,
  ImportedData,
  NotFoundError,
  NotLoggedInError,
  NotPrivilegeError,
} from "@cosense/types/rest";
import { cookie, getCSRFToken } from "./auth.ts";
import { parseHTTPError } from "./parseHTTPError.ts";
import { type HTTPError, responseIntoResult } from "./responseIntoResult.ts";
import {
  type BaseOptions,
  type ExtendedOptions,
  setDefaults,
} from "./options.ts";
import type { FetchError } from "./mod.ts";

export type ImportPagesError = HTTPError;

/** projectにページをインポートする
 *
 * @param project - インポート先のprojectの名前
 * @param data - インポートするページデータ
 */
export const importPages = async (
  project: string,
  data: ImportedData<boolean>,
  init: ExtendedOptions,
): Promise<
  Result<string, ImportPagesError | FetchError>
> => {
  if (data.pages.length === 0) return createOk("No pages to import.");

  const { sid, hostName, fetch } = setDefaults(init ?? {});
  const formData = new FormData();
  formData.append(
    "import-file",
    new Blob([JSON.stringify(data)], {
      type: "application/octet-stream",
    }),
  );
  formData.append("name", "undefined");

  const csrfResult = await getCSRFToken(init);
  if (isErr(csrfResult)) return csrfResult;

  const req = new Request(
    `https://${hostName}/api/page-data/import/${project}.json`,
    {
      method: "POST",
      headers: {
        ...(sid ? { Cookie: cookie(sid) } : {}),
        Accept: "application/json, text/plain, */*",
        "X-CSRF-TOKEN": unwrapOk(csrfResult),
      },
      body: formData,
    },
  );

  const res = await fetch(req);
  if (isErr(res)) return res;

  return mapAsyncForResult(
    responseIntoResult(unwrapOk(res)),
    async (res) => (await res.json()).message as string,
  );
};

export type ExportPagesError =
  | NotFoundError
  | NotPrivilegeError
  | NotLoggedInError
  | HTTPError;

/** `exportPages`の認証情報 */
export interface ExportInit<withMetadata extends true | false>
  extends BaseOptions {
  /** whether to includes metadata */ metadata: withMetadata;
}
/** projectの全ページをエクスポートする
 *
 * @param project exportしたいproject
 */
export const exportPages = async <withMetadata extends true | false>(
  project: string,
  init: ExportInit<withMetadata>,
): Promise<
  Result<ExportedData<withMetadata>, ExportPagesError | FetchError>
> => {
  const { sid, hostName, fetch, metadata } = setDefaults(init ?? {});

  const req = new Request(
    `https://${hostName}/api/page-data/export/${project}.json?metadata=${metadata}`,
    sid ? { headers: { Cookie: cookie(sid) } } : undefined,
  );
  const res = await fetch(req);
  if (isErr(res)) return res;

  return mapAsyncForResult(
    await mapErrAsyncForResult(
      responseIntoResult(unwrapOk(res)),
      async (error) =>
        (await parseHTTPError(error, [
          "NotFoundError",
          "NotLoggedInError",
          "NotPrivilegeError",
        ])) ?? error,
    ),
    (res) => res.json() as Promise<ExportedData<withMetadata>>,
  );
};
