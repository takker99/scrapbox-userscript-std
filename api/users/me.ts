import type { GuestUser, MemberUser } from "@cosense/types/rest";
import type { ResponseOfEndpoint } from "../../targeted_response.ts";
import { type BaseOptions, setDefaults } from "../../util.ts";
import { cookie } from "../../rest/auth.ts";

/** Constructs a request for the `/api/users/me endpoint`
 *
 * This endpoint retrieves the current user's profile information,
 * which can be either a {@linkcode MemberUser} or {@linkcode GuestUser} profile.
 *
 * @param init - Options including `connect.sid` (session ID) and other configuration
 * @returns A {@linkcode Request} object for fetching user profile data
 */
export const makeGetRequest = <R extends Response | undefined>(
  init?: BaseOptions<R>,
): Request => {
  const { sid, hostName } = setDefaults(init ?? {});
  return new Request(
    `https://${hostName}/api/users/me`,
    sid ? { headers: { Cookie: cookie(sid) } } : undefined,
  );
};

/** get the user profile
 *
 * @param init - Options including `connect.sid` (session ID) and other configuration
 * @returns A {@linkcode Response} object containing the user profile data
 */
export const get = <R extends Response | undefined = Response>(
  init?: BaseOptions<R>,
): Promise<
  ResponseOfEndpoint<{ 200: MemberUser | GuestUser }, R>
> =>
  setDefaults(init ?? {}).fetch(
    makeGetRequest(init),
  ) as Promise<ResponseOfEndpoint<{ 200: MemberUser | GuestUser }, R>>;
