import { toTitleLc } from "../../title.ts";

/** ページリンク */
export interface Link {
  /** リンク先のproject name */
  project: string;

  /** リンク先のpage title */
  title: string;
}

/** ページから別のページに遷移するときの状態を表す */
export interface PageTransitionContextLink {
  type: "page";

  /** 遷移元ページのリンク */
  from: Link;

  /** 遷移先ページのリンク */
  to: Link;
}

/** 全文検索結果から別のページに遷移するときの状態を表す */
export interface PageTransitionContextQuery {
  type: "search";

  /** 全文検索での検索語句 */
  query: string;

  /** 遷移先ページのリンク */
  to: Link;
}

export type PageTransitionContext =
  | PageTransitionContextLink
  | PageTransitionContextQuery;

/** ページ遷移状態を登録し、次回のページ遷移時にリンク先へスクロールする
 *
 * @param context 遷移状態
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
        linkFrom: `/${context.from.project}/${context.to.title}`,
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
