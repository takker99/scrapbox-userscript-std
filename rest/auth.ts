import { createOk, mapForResult, type Result } from "option-t/plain_result";
import { getProfile } from "./profile.ts";
import type { HTTPError } from "./responseIntoResult.ts";
import type { AbortError, NetworkError } from "./robustFetch.ts";
import type { ExtendedOptions } from "./options.ts";

/** Create a cookie string for HTTP headers
 *
 * This function creates a properly formatted cookie string for the `connect.sid`
 * session identifier, which is used for authentication in Scrapbox.
 *
 * @param sid - The session ID string stored in `connect.sid`
 * @returns A formatted {@linkcode string} in the format `"connect.sid={@linkcode sid}"`
 */
export const cookie = (sid: string): string => `connect.sid=${sid}`;

/** Retrieve the CSRF token for secure requests
 *
 * CSRF (Cross-Site Request Forgery) tokens are security measures that protect
 * against unauthorized requests. This function retrieves the token either from:
 * 1. `init.csrf`
 * 2. `globalThis._csrf`
 * 3. The user profile (if neither of the above is available)
 *
 * @param init - Optional {@linkcode ExtendedOptions} configuration including authentication details
 *              and CSRF token. If not provided, the function will attempt
 *              to get the token from other sources.
 * @returns A {@linkcode Result}<{@linkcode string}, {@linkcode NetworkError} | {@linkcode AbortError} | {@linkcode HTTPError}> containing:
 *          - Success: The CSRF token as a {@linkcode string}
 *          - Error: A {@linkcode NetworkError}, {@linkcode AbortError}, or {@linkcode HTTPError} describing what went wrong
 *          - Success: The CSRF token string
 *          - Error: One of several possible errors:
 *            - {@linkcode NetworkError}: Network connectivity issues
 *            - {@linkcode AbortError}: Request was aborted
 *            - {@linkcode HTTPError}: Server response error
 */
export const getCSRFToken = async (
  init?: ExtendedOptions,
): Promise<Result<string, NetworkError | AbortError | HTTPError>> => {
  // deno-lint-ignore no-explicit-any
  const csrf = init?.csrf ?? (globalThis as any)._csrf;
  return csrf ? createOk(csrf) : mapForResult(
    await getProfile(init),
    (user) => user.csrfToken,
  );
};
