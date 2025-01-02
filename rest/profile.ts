import type { GuestUser, MemberUser } from "@cosense/types/rest";
import { cookie } from "./auth.ts";
import { ScrapboxResponse } from "./response.ts";
import type { FetchError } from "./robustFetch.ts";
import { type BaseOptions, setDefaults } from "./options.ts";

export interface GetProfile {
  /** Build request for /api/users/me
   *
   * @param init connect.sid etc.
   * @return request
   */
  toRequest: (init?: BaseOptions) => Request;

  /** Get user profile from response
   *
   * @param res Response object
   * @return User profile
   */
  fromResponse: (
    res: Response,
  ) => Promise<
    ScrapboxResponse<MemberUser | GuestUser, ProfileError>
  >;

  (init?: BaseOptions): Promise<
    ScrapboxResponse<MemberUser | GuestUser, ProfileError | FetchError>
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

const getProfile_fromResponse: GetProfile["fromResponse"] = async (res) => {
  const response = ScrapboxResponse.from<MemberUser | GuestUser, ProfileError>(res);
  return response;
};

export const getProfile: GetProfile = /* @__PURE__ */ (() => {
  const fn: GetProfile = async (init) => {
    const { fetch, ...rest } = setDefaults(init ?? {});

    const response = await fetch(getProfile_toRequest(rest));
    return getProfile_fromResponse(response);
  };

  fn.toRequest = getProfile_toRequest;
  fn.fromResponse = getProfile_fromResponse;
  return fn;
})();
