import { BaseStore } from "@cosense/types/userscript";
import type { Page as PageData } from "@cosense/types/rest";

export interface SetPositionOptions {
  /** Whether to auto-scroll the page when the cursor moves outside the viewport
   * When true, the page will automatically scroll to keep the cursor visible
   *
   * @default true
   */
  scrollInView?: boolean;

  /** Source of the cursor movement event
   *
   * Can be set to "mouse" when the cursor movement is triggered by mouse interaction
   * This parameter helps distinguish between different types of cursor movements
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

/** Internal class for managing Scrapbox page data
 *
 * Note: Some type definitions are still in progress and may be incomplete
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
