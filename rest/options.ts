import { type RobustFetch, robustFetch } from "./robustFetch.ts";

/** 全てのREST APIに共通するopitons */
export interface BaseOptions {
  /** connect.sid
   *
   * private projectのデータやscrapbox accountに紐付いたデータを取得する際に必要な認証情報
   */
  sid?: string;

  /** データの取得に使う処理
   *
   * @default fetch
   */
  fetch?: RobustFetch;

  /** REST APIのdomain
   *
   * オンプレ版scrapboxなどだと、scrapbox.io以外のhost nameになるので、予め変えられるようにしておく
   *
   * @default "scrapbox.io"
   */
  hostName?: string;
}
/** BaseeOptionsにCSRF情報を入れたもの */
export interface ExtendedOptions extends BaseOptions {
  /** CSRF token
   *
   * If it isn't set, automatically get CSRF token from scrapbox.io server.
   */
  csrf?: string;
}

/** BaseOptionsの既定値を埋める */
export const setDefaults = <T extends BaseOptions = BaseOptions>(
  options: T,
): Omit<T, "fetch" | "hostName"> & Required<Omit<BaseOptions, "sid">> => {
  const { fetch = robustFetch, hostName = "scrapbox.io", ...rest } = options;
  return { fetch, hostName, ...rest };
};
