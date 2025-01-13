import { type RobustFetch, robustFetch } from "./robustFetch.ts";

/** Common options shared across all REST API endpoints
 *
 * These options configure authentication, network behavior, and host settings
 * for all API requests in the library.
 */
export interface BaseOptions {
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
  fetch?: RobustFetch;

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
/** Extended options including CSRF token configuration
 *
 * Extends BaseOptions with CSRF token support for endpoints
 * that require CSRF protection.
 */
export interface ExtendedOptions extends BaseOptions {
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
 */
export const setDefaults = <T extends BaseOptions = BaseOptions>(
  options: T,
): Omit<T, "fetch" | "hostName"> & Required<Omit<BaseOptions, "sid">> => {
  const { fetch = robustFetch, hostName = "scrapbox.io", ...rest } = options;
  return { fetch, hostName, ...rest };
};
