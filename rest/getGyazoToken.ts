import type { NotLoggedInError } from "../deps/scrapbox.ts";
import { cookie } from "./auth.ts";
import { UnexpectedResponseError } from "./error.ts";
import { tryToErrorLike } from "../is.ts";
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
  const path = `https://${hostName}/api/login/gyazo/oauth-upload/token${
    gyazoTeamsName ? `?gyazoTeamsName=${gyazoTeamsName}` : ""
  }`;

  const res = await fetch(
    path,
    sid ? { headers: { Cookie: cookie(sid) } } : undefined,
  );

  if (!res.ok) {
    const text = await res.text();
    const value = tryToErrorLike(text);
    if (!value) {
      throw new UnexpectedResponseError({
        path: new URL(path),
        ...res,
        body: await res.text(),
      });
    }
    return { ok: false, value: value as NotLoggedInError };
  }

  const { token } = (await res.json()) as { token?: string };
  return { ok: true, value: token };
};
