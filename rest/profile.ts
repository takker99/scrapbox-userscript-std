import type { GuestUser, MemberUser } from "../deps/scrapbox-rest.ts";
import { cookie } from "./auth.ts";
import { BaseOptions, setDefaults } from "./util.ts";
import { UnexpectedResponseError } from "./error.ts";

/** get user profile
 *
 * @param init connect.sid etc.
 */
export const getProfile = async (
  init?: BaseOptions,
): Promise<MemberUser | GuestUser> => {
  const { sid, hostName, fetch } = setDefaults(init ?? {});
  const request = new Request(
    `https://${hostName}/api/users/me`,
    sid ? { headers: { Cookie: cookie(sid) } } : undefined,
  );
  const response = await fetch(request);
  if (!response.ok) {
    throw new UnexpectedResponseError({ request, response });
  }
  return (await response.json()) as MemberUser | GuestUser;
};
