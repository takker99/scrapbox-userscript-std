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
  /** Gyazo Teamsのチーム名
   *
   * Gyazo Teamsでuploadしたいときに使う
   */
  gyazoTeamsName?: string;
}

export type GyazoTokenError = NotLoggedInError | HTTPError;

/** Gyazo OAuth uploadで使うaccess tokenを取得する
 *
 * @param init connect.sidなど
 * @return access token
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
