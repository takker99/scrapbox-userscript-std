/** Get the timestamp when a response was cached by the ServiceWorker
 *
 * This function retrieves the timestamp when a Response was cached by the
 * ServiceWorker, using a custom header `x-serviceworker-cached`. ServiceWorkers
 * are web workers that act as proxy servers between web apps, the browser,
 * and the network, enabling offline functionality and faster page loads.
 *
 * @param res - The Response object to check for cache information
 * @returns
 * - A number representing the UNIX timestamp (milliseconds since epoch) when
 *   the response was cached by the ServiceWorker
 * - `undefined` if:
 *   1. The response wasn't cached (no `x-serviceworker-cached` header)
 *   2. The header value couldn't be parsed as a number
 *
 * @example
 * ```typescript
 * const response = await fetch('/api/data');
 * const cachedAt = getCachedAt(response);
 * if (cachedAt) {
 *   console.log(`Data was cached at: ${new Date(cachedAt)}`);
 * } else {
 *   console.log('This is a fresh response from the server');
 * }
 * ```
 */
export const getCachedAt = (res: Response): number | undefined => {
  const cachedAt = res.headers.get("x-serviceworker-cached");
  if (!cachedAt) return;
  return parseInt(cachedAt);
};
