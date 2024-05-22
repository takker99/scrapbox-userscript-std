/** ServiceWorkerにcacheされた日時を得る
 *
 * cacheされたResponseでなければ`undefined`を返す
 *
 * @param res Response to check the chached date
 * @return cached date (as UNIX timestamp) or `undefined`
 */
export const getCachedAt = (res: Response): number | undefined => {
  const cachedAt = res.headers.get("x-serviceworker-cached");
  if (!cachedAt) return;
  return parseInt(cachedAt);
};
