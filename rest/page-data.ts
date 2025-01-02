import type {
  ExportedData,
  ImportedData,
  NotFoundError,
  NotLoggedInError,
  NotPrivilegeError,
} from "@cosense/types/rest";
import { cookie, getCSRFToken } from "./auth.ts";
import { parseHTTPError } from "./parseHTTPError.ts";
import type { TargetedResponse } from "./targeted_response.ts";
import { createErrorResponse, createSuccessResponse } from "./utils.ts";
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
  init?: ExtendedOptions,
): Promise<
  ScrapboxResponse<string, ImportPagesError | FetchError>
> => {
  if (data.pages.length === 0) {
    return ScrapboxResponse.ok("No pages to import.");
  }

  const { sid, hostName, fetch } = setDefaults(init ?? {});
  const formData = new FormData();
  formData.append(
    "import-file",
    new Blob([JSON.stringify(data)], {
      type: "application/octet-stream",
    }),
  );
  formData.append("name", "undefined");

  const csrfToken = await getCSRFToken(init);
  if (!csrfToken.ok) return csrfToken;

  const req = new Request(
    `https://${hostName}/api/page-data/import/${project}.json`,
    {
      method: "POST",
      headers: {
        ...(sid ? { Cookie: cookie(sid) } : {}),
        Accept: "application/json, text/plain, */*",
        "X-CSRF-TOKEN": csrfToken.data,
      },
      body: formData,
    },
  );

  const res = await fetch(req);
  const response = ScrapboxResponse.from<string, ImportPagesError>(res);

  if (response.ok) {
    const json = await response.json();
    return ScrapboxResponse.ok(json.message as string);
  }

  return response;
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
  ScrapboxResponse<ExportedData<withMetadata>, ExportPagesError | FetchError>
> => {
  const { sid, hostName, fetch, metadata } = setDefaults(init ?? {});

  const req = new Request(
    `https://${hostName}/api/page-data/export/${project}.json?metadata=${metadata}`,
    sid ? { headers: { Cookie: cookie(sid) } } : undefined,
  );
  const res = await fetch(req);
  const response = ScrapboxResponse.from<
    ExportedData<withMetadata>,
    ExportPagesError
  >(res);

  await parseHTTPError(response, [
    "NotFoundError",
    "NotLoggedInError",
    "NotPrivilegeError",
  ]);

  return response;
};
