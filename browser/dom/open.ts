import { encodeTitleURI } from "../../title.ts";
import {
  type PageTransitionContext,
  pushPageTransition,
} from "./pushPageTransition.ts";
import type { Scrapbox } from "@cosense/types/userscript";
declare const scrapbox: Scrapbox;

export interface OpenOptions {
  /** line id */
  id?: string;

  /** Text to append to the page content */
  body?: string;

  /** Whether to open the page in a new tab
   * - `true`: open in a new tab
   * - `false`: open in the same tab
   *
   * @default {false}
   */
  newTab?: boolean;

  /** Whether to reload the page when opening in the same tab
   *
   * Default value is `false` for same project (no reload) and `true` for different project (force reload)
   */
  reload?: boolean;

  /** Context information required for the auto-scroll feature when navigating to linked content */
  context?: Omit<PageTransitionContext, "to">;
}

/** Open a page
 *
 * @param project - Project name of the page to open
 * @param title - Title of the page to open
 * @param options - Configuration options for opening the page
 */
export const open = (
  project: string,
  title: string,
  options?: OpenOptions,
): void => {
  const url = new URL(`/${project}/${encodeTitleURI(title)}`, location.href);
  if (options?.body) url.search = `?body=${encodeURIComponent(options.body)}`;
  if (options?.id) url.hash = `#${options.id}`;

  if (options?.context) {
    pushPageTransition(
      { ...options?.context, to: { project, title } } as PageTransitionContext,
    );
  }

  if (
    options?.newTab !== false &&
    (options?.newTab === true || project !== scrapbox.Project.name)
  ) {
    globalThis.open(url);
    return;
  }
  if (
    options?.reload !== false &&
    (options?.reload === true || project !== scrapbox.Project.name)
  ) {
    globalThis.open(url, "_self");
    return;
  }

  const a = document.createElement("a");
  a.href = url.toString();
  document.body.append(a);
  a.click();
  a.remove();
};

/** Open a page in the same tab
 *
 * The page will not be reloaded when opened
 *
 * @param project - Project name of the page to open
 * @param title - Title of the page to open
 * @param [body] - Text to append to the page
 */
export const openInTheSameTab = (
  project: string,
  title: string,
  body?: string,
): void => open(project, title, { newTab: false, reload: false, body });
