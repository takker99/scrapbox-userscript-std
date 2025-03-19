/**
 * Timestamp string whose format is `YYYY-MM-DDTHH:mm:ssZ`
 */
export type Timestamp = string;

/** Represents {@linkcode fetch}
 *
 * This type can return `undefined`, which is useful for implementing `fetch` using Cache API.
 */
export type Fetch<R extends Response | undefined> = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<R>;

/** Common options shared across all REST API endpoints
 *
 * These options configure authentication, network behavior, and host settings
 * for all API requests in the library.
 */
export interface BaseOptions<R extends Response | undefined> {
  /** Scrapbox session ID (connect.sid)
   *
   * Authentication token required to access:
   * - Private project data
   * - User-specific data linked to Scrapbox accounts
   * - Protected API endpoints
   */
  sid?: string;

  /** Custom fetch implementation for making HTTP requests
   *
   * Allows overriding the default fetch behavior for testing
   * or custom networking requirements.
   *
   * @default {globalThis.fetch}
   */
  fetch?: Fetch<R>;

  /** Domain for REST API endpoints
   *
   * Configurable host name for API requests. This allows using the library
   * with self-hosted Scrapbox instances or other custom deployments that
   * don't use the default scrapbox.io domain.
   *
   * @default {"scrapbox.io"}
   */
  hostName?: string;
}

/** Options for Gyazo API which requires OAuth */
export interface OAuthOptions<R extends Response | undefined>
  extends BaseOptions<R> {
  /** an access token associated with the Gyazo user account */
  accessToken: string;
}

/** Extended options including CSRF token configuration
 *
 * Extends BaseOptions with CSRF token support for endpoints
 * that require CSRF protection.
 */
export interface ExtendedOptions<R extends Response | undefined>
  extends BaseOptions<R> {
  /** CSRF token
   *
   * If it isn't set, automatically get CSRF token from scrapbox.io server.
   */
  csrf?: string;
}

/** Set default values for {@linkcode BaseOptions}
 *
 * Ensures all required fields have appropriate default values while
 * preserving any user-provided options.
 *
 * @param options - User-provided {@linkcode Options} to merge with defaults
 * @returns {@linkcode Options} object with all required fields populated
 *
 * @internal
 */
export const setDefaults = <
  // deno-lint-ignore no-explicit-any
  T extends BaseOptions<any> = BaseOptions<Response>,
>(
  options: T,
): Omit<T, "fetch" | "hostName"> & Required<Pick<T, "fetch" | "hostName">> => {
  const { fetch = globalThis.fetch, hostName = "scrapbox.io", ...rest } =
    options;
  return { fetch, hostName, ...rest };
};
