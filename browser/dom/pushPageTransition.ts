import { toTitleLc } from "../../title.ts";

/** Represents a link to a Scrapbox page */
export interface Link {
  /** The project name of the linked page */
  project: string;

  /** The title of the linked page */
  title: string;
}

/** Represents the state of a page-to-page navigation
 * Used to track navigation between two specific pages within Scrapbox
 */
export interface PageTransitionContextLink {
  type: "page";

  /** Link to the source/origin page */
  from: Link;

  /** Link to the destination/target page */
  to: Link;
}

/** Represents the state when navigating from search results to a specific page
 * Used to track navigation that originates from a full-text search
 */
export interface PageTransitionContextQuery {
  type: "search";

  /** The search query used in the full-text search */
  query: string;

  /** Link to the destination/target page */
  to: Link;
}

export type PageTransitionContext =
  | PageTransitionContextLink
  | PageTransitionContextQuery;

/** Registers the page transition state and enables automatic scrolling to the linked content
 * This function stores navigation context in localStorage, which is used to determine
 * where to scroll on the next page load. This is particularly useful for maintaining
 * context when users navigate between related pages or from search results.
 *
 * @param context The transition state containing source and destination information
 */
export const pushPageTransition = (context: PageTransitionContext): void => {
  const pageTransitionContext: Record<string, unknown> = JSON.parse(
    localStorage.getItem("pageTransitionContext") ?? "",
  );
  const value = context.type === "page"
    ? context.from.project === context.to.project
      ? context.from.title === context.to.title
        ? {
          titleHint: context.to.title,
        }
        : {
          linkFrom: context.from.title,
        }
      : {
        linkFrom: `/${context.from.project}/${context.from.title}`,
      }
    : {
      searchQuery: context.query,
    };
  pageTransitionContext[`page_${toTitleLc(context.to.title)}`] = value;
  localStorage.setItem(
    "pageTransitionContext",
    JSON.stringify(pageTransitionContext),
  );
};
