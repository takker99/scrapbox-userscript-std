import {
  isErr,
  mapAsyncForResult,
  mapErrAsyncForResult,
  type Result,
  unwrapOk,
} from "option-t/plain_result";
import type { NotLoggedInError } from "@cosense/types/rest";
import { cookie } from "./auth.ts";
import { parseHTTPError } from "./parseHTTPError.ts";
import { type HTTPError, responseIntoResult } from "./responseIntoResult.ts";
import { type BaseOptions, setDefaults } from "./options.ts";
import type { FetchError } from "./mod.ts";

export interface GetGyazoTokenOptions extends BaseOptions {
  /** The team name for Gyazo Teams
   *
   * Specify this parameter when you want to upload images to a Gyazo Teams workspace.
   * If not provided, the image will be uploaded to your personal Gyazo account.
   *
   * @example
   * ```typescript
   * import { isErr, unwrapErr, unwrapOk } from "option-t/plain_result";
   *
   * const result = await getGyazoToken({ gyazoTeamsName: "my-team" });
   * if (isErr(result)) {
   *   throw new Error(`Failed to get Gyazo token: ${unwrapErr(result)}`);
   * }
   * const token = unwrapOk(result);
   * ```
   */
  gyazoTeamsName?: string;
}

export type GyazoTokenError = NotLoggedInError | HTTPError;

/** Retrieve an OAuth access token for uploading images to Gyazo
 *
 * This function obtains an OAuth access token that can be used to upload images
 * to Gyazo or Gyazo Teams. The token is obtained through Scrapbox's API, which
 * handles the OAuth flow with Gyazo.
 *
 * @param init Optional configuration
 * @returns A {@linkcode Result} containing either:
 *          - Success: The access token string, or `undefined` if no token is available
 *          - Error: {@linkcode NotLoggedInError} if not authenticated, or {@linkcode HTTPError} for other failures
 *
 * @example
 * ```typescript
 * import { isErr, unwrapErr, unwrapOk } from "option-t/plain_result";
 *
 * const result = await getGyazoToken();
 * if (isErr(result)) {
 *   throw new Error(`Failed to get Gyazo token: ${unwrapErr(result)}`);
 * }
 * const token = unwrapOk(result);
 * ```
 */
export const getGyazoToken = async (
  init?: GetGyazoTokenOptions,
): Promise<Result<string | undefined, GyazoTokenError | FetchError>> => {
  const { fetch, sid, hostName, gyazoTeamsName } = setDefaults(init ?? {});
  const req = new Request(
    `https://${hostName}/api/login/gyazo/oauth-upload/token${
      gyazoTeamsName ? `?gyazoTeamsName=${gyazoTeamsName}` : ""
    }`,
    sid ? { headers: { Cookie: cookie(sid) } } : undefined,
  );

  const res = await fetch(req);
  if (isErr(res)) return res;

  return mapAsyncForResult(
    await mapErrAsyncForResult(
      responseIntoResult(unwrapOk(res)),
      async (error) =>
        (await parseHTTPError(error, ["NotLoggedInError"])) ?? error,
    ),
    (res) => res.json().then((json) => json.token as string | undefined),
  );
};
