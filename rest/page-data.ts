import type {
  ErrorLike,
  ExportedData,
  ImportedData,
  NotFoundError,
  NotLoggedInError,
  NotPrivilegeError,
} from "../deps/scrapbox.ts";
import { cookie, getCSRFToken } from "./auth.ts";
import { UnexpectedResponseError } from "./error.ts";
import { tryToErrorLike } from "../is.ts";
import { BaseOptions, ExtendedOptions, Result, setDefaults } from "./util.ts";
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
  Result<string, ErrorLike>
> => {
  if (data.pages.length === 0) {
    return { ok: true, value: "No pages to import." };
  }

  const { sid, hostName, fetch, csrf } = setDefaults(init ?? {});
  const formData = new FormData();
  formData.append(
    "import-file",
    new Blob([JSON.stringify(data)], {
      type: "application/octet-stream",
    }),
  );
  formData.append("name", "undefined");
  const path = `https://${hostName}/api/page-data/import/${project}.json`;

  const res = await fetch(
    path,
    {
      method: "POST",
      headers: {
        ...(sid ? { Cookie: cookie(sid) } : {}),
        Accept: "application/json, text/plain, */*",
        "X-CSRF-TOKEN": csrf ?? await getCSRFToken(init),
      },
      body: formData,
    },
  );

  if (!res.ok) {
    const text = await res.json();
    const value = tryToErrorLike(text);
    if (!value) {
      throw new UnexpectedResponseError({
        path: new URL(path),
        ...res,
        body: await res.text(),
      });
    }
    return { ok: false, value };
  }

  const { message } = (await res.json()) as { message: string };
  return { ok: true, value: message };
};

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
  Result<
    ExportedData<withMetadata>,
    NotFoundError | NotPrivilegeError | NotLoggedInError
  >
> => {
  const { sid, hostName, fetch, metadata } = setDefaults(init ?? {});
  const path =
    `https://${hostName}/api/page-data/export/${project}.json?metadata=${metadata}`;
  const res = await fetch(
    path,
    sid ? { headers: { Cookie: cookie(sid) } } : undefined,
  );

  if (!res.ok) {
    const text = await res.json();
    const value = tryToErrorLike(text);
    if (!value) {
      throw new UnexpectedResponseError({
        path: new URL(path),
        ...res,
        body: await res.text(),
      });
    }
    return {
      ok: false,
      value: value as NotFoundError | NotPrivilegeError | NotLoggedInError,
    };
  }

  const value = (await res.json()) as ExportedData<withMetadata>;
  return { ok: true, value };
};
