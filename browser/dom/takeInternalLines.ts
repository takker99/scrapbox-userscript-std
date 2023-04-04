import { lines } from "./dom.ts";
import { BaseLine } from "../../deps/scrapbox.ts";

/** Scrapbox内部の本文データの参照を取得する
 *
 * `scrapbox.Page.lines`はdeep cloneされてしまうので、performanceの問題が発生する場合がある
 *
 * なるべくデータのcloneを発生させたくない場合にこちらを使う
 *
 * 注意
 * - 参照をそのまま返しているだけなので、中身を書き換えられてしまう。型定義で変更不能にはしてあるが、JS経由ならいくらでも操作できる
 * - `scrapbox.Page.lines`とは違って構文解析情報が付与されない
 */
export const takeInternalLines = (): readonly BaseLine[] => {
  const linesEl = lines();
  if (!linesEl) {
    throw Error(`div.lines is not found.`);
  }

  const reactKey = Object.keys(linesEl)
    .find((key) => key.startsWith("__reactFiber"));
  if (!reactKey) {
    throw Error(
      'div.lines must has the property whose name starts with "__reactFiber"',
    );
  }

  // @ts-ignore DOMを無理矢理objectとして扱っている
  return (linesEl[reactKey] as ReactFiber).return.stateNode.props
    .lines as const;
};

interface ReactFiber {
  return: {
    stateNode: {
      props: {
        lines: BaseLine[];
      };
    };
  };
}
