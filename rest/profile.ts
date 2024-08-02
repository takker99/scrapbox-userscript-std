import {
  isErr,
  mapAsyncForResult,
  type Result,
  unwrapOk,
} from "../deps/option-t.ts";
import type { GuestUser, MemberUser } from "../deps/scrapbox-rest.ts";
import { cookie } from "./auth.ts";
import { type HTTPError, responseIntoResult } from "./responseIntoResult.ts";
import type { AbortError, NetworkError } from "./robustFetch.ts";
import { type BaseOptions, setDefaults } from "./util.ts";

export interface GetProfile {
  /** /api/users/me の要求を組み立てる
   *
   * @param init connect.sid etc.
   * @return request
   */
  toRequest: (init?: BaseOptions) => Request;

  /** get the user profile from the given response
   *
   * @param res response
   * @return user profile
   */
  fromResponse: (
    res: Response,
  ) => Promise<
    Result<MemberUser | GuestUser, HTTPError>
  >;

  (init?: BaseOptions): Promise<
    Result<MemberUser | GuestUser, NetworkError | HTTPError | AbortError>
  >;
}

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

export const getProfile: GetProfile = async (init) => {
  const { fetch, ...rest } = setDefaults(init ?? {});

  const resResult = await fetch(getProfile_toRequest(rest));
  return isErr(resResult)
    ? resResult
    : getProfile_fromResponse(unwrapOk(resResult));
};

getProfile.toRequest = getProfile_toRequest;
getProfile.fromResponse = getProfile_fromResponse;
