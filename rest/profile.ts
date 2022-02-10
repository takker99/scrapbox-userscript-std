import type { GuestUser, MemberUser } from "../deps/scrapbox.ts";
import { cookie, makeCustomError } from "./utils.ts";

export interface ProfileInit {
  /** connect.sid */ sid: string;
}
/** get user profile
 *
 * @param init connect.sid etc.
 */
export async function getProfile(
  init?: ProfileInit,
): Promise<MemberUser | GuestUser> {
  const path = "https://scrapbox.io/api/users/me";
  const res = await fetch(
    path,
    init?.sid
      ? {
        headers: {
          Cookie: cookie(init.sid),
        },
      }
      : undefined,
  );

  if (!res.ok) {
    throw makeCustomError(
      "UnexpectedError",
      `Unexpected error has occuerd when fetching "${path}"`,
    );
  }
  return (await res.json()) as MemberUser | GuestUser;
}
