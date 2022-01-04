import type {
  ErrorLike,
  ExportedData,
  ImportedData,
  NotFoundError,
  NotLoggedInError,
  NotPrivilegeError,
} from "../deps/scrapbox.ts";
import { cookie, getCSRFToken } from "./utils.ts";
import type { Result } from "./utils.ts";

/** `importPages`の認証情報 */
export interface ImportInit {
  /** connect.sid */ sid: string;
  /** CSRF token
   *
   * If it isn't set, automatically get CSRF token from scrapbox.io server.
   */
  csrf?: string;
}
/** projectにページをインポートする
 *
 * @param project - インポート先のprojectの名前
 * @param data - インポートするページデータ
 */
export async function importPages(
  project: string,
  data: ImportedData<boolean>,
  { sid, csrf }: ImportInit,
): Promise<
  Result<{ message: string }, ErrorLike>
> {
  if (data.pages.length === 0) {
    return { ok: true, message: "No pages to import." };
  }

  const formData = new FormData();
  formData.append(
    "import-file",
    new Blob([JSON.stringify(data)], {
      type: "application/octet-stream",
    }),
  );
  formData.append("name", "undefined");

  if (!csrf) {
    const result = await getCSRFToken(sid);
    if (!result.ok) return result;
    csrf = result.csrfToken;
  }

  const res = await fetch(
    `https://scrapbox.io/api/page-data/import/${project}.json`,
    {
      method: "POST",
      headers: {
        Cookie: cookie(sid),
        Accept: "application/json, text/plain, */*",
        "X-CSRF-TOKEN": csrf,
      },
      body: formData,
    },
  );

  if (!res.ok) {
    if (res.status === 503) {
      const error = new Error();
      error.name = "ServerError";
      error.message = "503 Service Unavailable";
      throw error;
    }
    const error = (await res.json()) as ErrorLike;
    return { ok: false, ...error };
  }
  const result = (await res.json()) as { message: string };
  return { ok: true, ...result };
}

/** `exportPages`の認証情報 */
export interface ExportInit<withMetadata extends true | false> {
  /** connect.sid */ sid: string;
  /** whether to includes metadata */ metadata: withMetadata;
}
/** projectの全ページをエクスポートする
 *
 * @param project exportしたいproject
 */
export async function exportPages<withMetadata extends true | false>(
  project: string,
  { sid, metadata }: ExportInit<withMetadata>,
): Promise<
  Result<
    ExportedData<withMetadata>,
    NotFoundError | NotPrivilegeError | NotLoggedInError
  >
> {
  const res = await fetch(
    `https://scrapbox.io/api/page-data/export/${project}.json?metadata=${metadata}`,
    {
      headers: {
        Cookie: cookie(sid),
      },
    },
  );

  if (!res.ok) {
    const error = (await res.json()) as
      | NotFoundError
      | NotPrivilegeError
      | NotLoggedInError;
    return { ok: false, ...error };
  }
  const result = (await res.json()) as ExportedData<withMetadata>;
  return { ok: true, ...result };
}
