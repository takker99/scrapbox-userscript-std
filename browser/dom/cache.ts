/** scrapbox.ioが管理しているcache storageから、最新のresponseを取得する
 *
 * ほぼ https://scrapbox.io/daiiz/ScrapboxでのServiceWorkerとCacheの活用#5d2efaffadf4e70000651173 のパクリ
 *
 * @param request このrequestに対応するresponseが欲しい
 * @param options search paramsを無視したいときとかに使う
 * @return cacheがあればそのresponseを、なければ`undefined`を返す
 */
export const findLatestCache = async (
  request: Request,
  options?: CacheQueryOptions,
): Promise<Response | undefined> => {
  const cacheNames = await globalThis.caches.keys();

  for (const date of cacheNames.sort().reverse()) {
    const cache = await caches.open(date);
    const res = await cache.match(request, options);
    if (res) return res;
  }
};

/** scrapbox.ioが管理しているREST API系のcache storageにresponseを保存する
 *
 * @param request このrequestに対応するresponseを保存する
 * @param response 保存するresponse
 */
export const saveApiCache = async (
  request: Request,
  response: Response,
): Promise<void> => {
  const res = response.clone();
  const cache = await caches.open(generateCacheName(new Date()));
  return await cache.put(request, res);
};

export const generateCacheName = (date: Date): string =>
  `api-${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, "0")}-${
    `${date.getDate()}`.padStart(2, "0")
  }`;

/** prefetchを実行する
 *
 * prefetchしたデータは`"prefetch"`と`"api-yyyy-MM-dd"`に格納される
 *
 * `"prefetch"`に格納されたデータは、次回のリクエストで返却されたときに削除される
 *
 * 回線が遅いときは例外を投げる
 *
 * @param urls prefetchしたいAPIのURLのリスト
 */
export const prefetch = (urls: (string | URL)[]): Promise<void> =>
  postMessage({
    title: "prefetch",
    body: { urls: urls.map((url) => url.toString()) },
  });

/** 指定したAPIのcacheの更新を依頼する
 *
 * 更新は10秒ごとに1つずつ実行される
 *
 * @param cacheしたいAPIのURL
 */
export const fetchApiCache = (url: string): Promise<void> =>
  postMessage({ title: "fetchApiCache", body: { url } });

const postMessage = <T, U = unknown>(
  data: { title: string; body: T },
): Promise<U> => {
  const { controller } = navigator.serviceWorker;
  if (!controller) {
    const error = new Error();
    error.name = "ServiceWorkerNotActiveYetError";
    error.message = "Service worker is not active yet";
    throw error;
  }

  return new Promise<U>((resolve, reject) => {
    const channel = new MessageChannel();
    channel.port1.addEventListener(
      "message",
      (event) =>
        event.data?.error ? reject(event.data.error) : resolve(event.data),
    );
    controller.postMessage(data, [channel.port2]);
  });
};
