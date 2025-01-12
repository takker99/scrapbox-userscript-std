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

/** Import pages into a Scrapbox project
 *
 * Imports multiple pages into a specified project. The pages are provided as a structured
 * data object that follows the {@linkcode ImportedData} format.
 *
 * @param project - Name of the target project to import pages into
 * @param data - Page data to import, following the {@linkcode ImportedData} format
 * @param init - Optional configuration for the import operation
 * @returns A {@linkcode Result} containing either a success message or an error
 */
export const importPages = async (
  project: string,
  data: ImportedData<boolean>,
  init?: ExtendedOptions,
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

/** Configuration options for the {@linkcode exportPages} function
 *
 * Extends {@linkcode BaseOptions} with metadata control for page exports.
 */
export interface ExportInit<withMetadata extends true | false>
  extends BaseOptions {
  /** whether to includes metadata */
  metadata: withMetadata;
}
/** Export all pages from a Scrapbox project
 *
 * Retrieves all pages from the specified project, optionally including metadata.
 * Requires appropriate authentication for private projects.
 *
 * @param project - Name of the project to export
 * @param init - Configuration options including metadata preference
 * @returns A {@linkcode Result} containing either the exported data or an error
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
