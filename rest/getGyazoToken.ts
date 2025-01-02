import type { NotLoggedInError } from "@cosense/types/rest";
import { cookie } from "./auth.ts";
import { parseHTTPError } from "./parseHTTPError.ts";
import { ScrapboxResponse } from "./response.ts";
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
): Promise<ScrapboxResponse<string | undefined, GyazoTokenError | FetchError>> => {
  const { fetch, sid, hostName, gyazoTeamsName } = setDefaults(init ?? {});
  const req = new Request(
    `https://${hostName}/api/login/gyazo/oauth-upload/token${
      gyazoTeamsName ? `?gyazoTeamsName=${gyazoTeamsName}` : ""
    }`,
    sid ? { headers: { Cookie: cookie(sid) } } : undefined,
  );

  const res = await fetch(req);
  const response = ScrapboxResponse.from<string | undefined, GyazoTokenError>(res);

  await parseHTTPError(response, ["NotLoggedInError"]);

  if (response.ok) {
    const json = await response.json();
    return ScrapboxResponse.ok(json.token as string | undefined);
  }

  return response;
};
