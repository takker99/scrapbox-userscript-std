import { BaseStore } from "@cosense/types/userscript";
import type { Page as PageData } from "@cosense/types/rest";

export interface SetPositionOptions {
  /** カーソルが画面外に移動したとき、カーソルが見える位置までページをスクロールするかどうか
   *
   * @default true
   */
  scrollInView?: boolean;

  /** カーソル移動イベントの発生箇所？
   *
   * コード内だと、"mouse"が指定されていた場合があった。詳細は不明
   */
  source?: "mouse";
}

export interface ApiUrlForFetch {
  projectName: string;
  title: string;
  titleHint: string;
  followRename: boolean;
  search: string;
}

export interface ApplySnapshotInit {
  page: Pick<PageData, "title" | "lines" | "created">;
  prevPage?: Pick<PageData, "created">;
  nextPage?: Pick<PageData, "lines">;
}

export type PageWithCache = PageData & { cachedAt: number | undefined };

/** Scrapboxのページデータを管理する内部クラス
 *
 * 一部型定義は書きかけ
 */
export declare class Page extends BaseStore<
  { source: "mouse" | undefined } | "focusTextInput" | "scroll" | undefined
> {
  public initialize(): void;

  private data: PageWithCache;

  public get(): PageWithCache;

  public apiUrlForFetch(init: ApiUrlForFetch): string;
  public apiUrlForUpdatePageAccessed(pageId: string): string;
  public fetch(): Promise<PageWithCache>;

  public set(page: PageWithCache): void;
  public reset(): void;
  public applySnapshot(init: ApplySnapshotInit): void;
  setTitle(title: string, init?: { from: string }): void;
  get fromCacheStorage(): boolean;
  public setPin(pin: number): void;
  public delete(): void;
  public patch(t: unknown): void;
  public patchChanges(
    t: unknown,
    init?: { from: string },
  ): Promise<unknown>;
  get hasSelfBackLink(): boolean;
  public requestFetchApiCacheToServiceWorker(): unknown;
}
