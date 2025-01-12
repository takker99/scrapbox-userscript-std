import {
  isErr,
  mapAsyncForResult,
  type Result,
  unwrapOk,
} from "option-t/plain_result";
import type { GuestUser, MemberUser } from "@cosense/types/rest";
import { cookie } from "./auth.ts";
import { type HTTPError, responseIntoResult } from "./responseIntoResult.ts";
import type { FetchError } from "./robustFetch.ts";
import { type BaseOptions, setDefaults } from "./options.ts";

export interface GetProfile {
  /** Constructs a request for the `/api/users/me endpoint`
   *
   * This endpoint retrieves the current user's profile information,
   * which can be either a {@linkcode MemberUser} or {@linkcode GuestUser} profile.
   *
   * @param init - Options including `connect.sid` (session ID) and other configuration
   * @returns A {@linkcode Request} object for fetching user profile data
   */
  toRequest: (init?: BaseOptions) => Request;

  /** get the user profile from the given response
   *
   * @param res - Response from the API
   * @returns A {@linkcode Result}<{@linkcode UserProfile}, {@linkcode Error}> containing:
   *          - Success: The user's profile data
   *          - Error: One of several possible errors:
   *            - {@linkcode NotLoggedInError}: Authentication required
   *            - {@linkcode HTTPError}: Other HTTP errors
   */
  fromResponse: (
    res: Response,
  ) => Promise<
    Result<MemberUser | GuestUser, ProfileError>
  >;

  (init?: BaseOptions): Promise<
    Result<MemberUser | GuestUser, ProfileError | FetchError>
  >;
}

export type ProfileError = HTTPError;

const getProfile_toRequest: GetProfile["toRequest"] = (
  init,
) => {
  const { sid, hostName } = setDefaults(init ?? {});
  return new Request(
    `https://${hostName}/api/users/me`,
    sid ? { headers: { Cookie: cookie(sid) } } : undefined,
  );
};

const getProfile_fromResponse: GetProfile["fromResponse"] = (response) =>
  mapAsyncForResult(
    responseIntoResult(response),
    async (res) => (await res.json()) as MemberUser | GuestUser,
  );

export const getProfile: GetProfile = /* @__PURE__ */ (() => {
  const fn: GetProfile = async (init) => {
    const { fetch, ...rest } = setDefaults(init ?? {});

    const resResult = await fetch(getProfile_toRequest(rest));
    return isErr(resResult)
      ? resResult
      : getProfile_fromResponse(unwrapOk(resResult));
  };

  fn.toRequest = getProfile_toRequest;
  fn.fromResponse = getProfile_fromResponse;
  return fn;
})();
