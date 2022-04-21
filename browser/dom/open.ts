/// <reference no-default-lib="true"/>
/// <reference lib="esnext"/>
/// <reference lib="dom" />

import { encodeTitleURI } from "../../title.ts";
import type { Scrapbox } from "../../deps/scrapbox.ts";
declare const scrapbox: Scrapbox;

export interface OpenOptions {
  /** line id */
  id?: string;

  /** ページに追記するテキスト */
  body?: string;

  /** 新しいタブで開くかどうか
   *
   * @default 同じタブで開く
   */
  newTab?: boolean;

  /** 同じタブでページを開く場合、ページを再読込するかどうか
   *
   * @default 同じprojectの場合は再読み込みせず、違うprojectの場合は再読込する
   */
  reload?: boolean;
}

/** ページを開く
 *
 * @param project 開くページのproject名
 * @param title 開くページのタイトル
 * @param options
 */
export const open = (
  project: string,
  title: string,
  options?: OpenOptions,
) => {
  const url = new URL(`/${project}/${encodeTitleURI(title)}`, location.href);
  if (options?.body) url.search = `?body=${encodeURIComponent(options.body)}`;
  if (options?.id) url.hash = `#${options.id}`;

  if (
    options?.newTab !== false &&
    (options?.newTab === true || project !== scrapbox.Project.name)
  ) {
    window.open(url);
    return;
  }
  if (
    options?.reload !== false &&
    (options?.reload === true || project !== scrapbox.Project.name)
  ) {
    window.open(url, "_self");
    return;
  }

  const a = document.createElement("a");
  a.href = url.toString();
  document.body.append(a);
  a.click();
  a.remove();
};

/** 同じタブでページを開く
 *
 * このとき、ページは再読み込みされない
 *
 * @param project 開くページのproject名
 * @param title 開くページのタイトル
 * @param [body] ページに追記するテキスト
 */
export const openInTheSameTab = (
  project: string,
  title: string,
  body?: string,
) => open(project, title, { newTab: false, reload: false, body });
