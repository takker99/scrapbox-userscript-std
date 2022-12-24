import type { NotLoggedInError } from "../deps/scrapbox-rest.ts";
import { cookie } from "./auth.ts";
import { makeError } from "./error.ts";
import { BaseOptions, Result, setDefaults } from "./util.ts";

export interface GetGyazoTokenOptions extends BaseOptions {
  /** Gyazo Teamsのチーム名
   *
   * Gyazo Teamsでuploadしたいときに使う
   */
  gyazoTeamsName?: string;
}

/** Gyazo OAuth uploadで使うaccess tokenを取得する
 *
 * @param init connect.sidなど
 * @return access token
 */
export const getGyazoToken = async (
  init?: GetGyazoTokenOptions,
): Promise<
  Result<
    string | undefined,
    NotLoggedInError
  >
> => {
  const { sid, hostName, gyazoTeamsName } = setDefaults(init ?? {});
  const req = new Request(
    `https://${hostName}/api/login/gyazo/oauth-upload/token${
      gyazoTeamsName ? `?gyazoTeamsName=${gyazoTeamsName}` : ""
    }`,
    sid ? { headers: { Cookie: cookie(sid) } } : undefined,
  );

  const res = await fetch(req);
  if (!res.ok) {
    return makeError<NotLoggedInError>(res);
  }

  const { token } = (await res.json()) as { token?: string };
  return { ok: true, value: token };
};
