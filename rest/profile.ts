import type { GuestUser, MemberUser } from "../deps/scrapbox.ts";
import { cookie } from "./auth.ts";
import { BaseOptions, setDefaults } from "./util.ts";
import { UnexpectedResponseError } from "./error.ts";

/** get user profile
 *
 * @param init connect.sid etc.
 */
export async function getProfile(
  init?: BaseOptions,
): Promise<MemberUser | GuestUser> {
  const { sid, hostName, fetch } = setDefaults(init ?? {});
  const path = `https://${hostName}/api/users/me`;
  const res = await fetch(
    path,
    sid ? { headers: { Cookie: cookie(sid) } } : undefined,
  );
  if (!res.ok) {
    throw new UnexpectedResponseError({
      path: new URL(path),
      ...res,
      body: await res.text(),
    });
  }
  return (await res.json()) as MemberUser | GuestUser;
}
