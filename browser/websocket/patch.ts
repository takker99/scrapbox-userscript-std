import { Change, DeletePageChange, PinChange } from "../../deps/socket.ts";
import { makeChanges } from "./makeChanges.ts";
import { Line, Page } from "../../deps/scrapbox-rest.ts";
import { push, PushOptions, RetryError } from "./push.ts";
import { suggestUnDupTitle } from "./suggestUnDupTitle.ts";
import { Result } from "../../rest/util.ts";

export type PatchOptions = PushOptions;

export interface PatchMetadata extends Page {
  /** 書き換えを再試行した回数
   *
   * 初回は`0`で、再試行するたびに増える
   */
  attempts: number;
}

/** ページ全体を書き換える
 *
 * serverには書き換え前後の差分だけを送信する
 *
 * @param project 書き換えたいページのproject
 * @param title 書き換えたいページのタイトル
 * @param update 書き換え後の本文を作成する函数。引数には現在の本文が渡される。空配列を返すとページが削除される。undefinedを返すと書き換えを中断する
 * @param options 使用したいSocketがあれば指定する
 */
export const patch = (
  project: string,
  title: string,
  update: (
    lines: Line[],
    metadata: PatchMetadata,
  ) => string[] | undefined | Promise<string[] | undefined>,
  options?: PatchOptions,
): Promise<Result<string, RetryError>> =>
  push(
    project,
    title,
    async (page, attempts, prev, reason) => {
      if (reason === "DuplicateTitleError") {
        const fallbackTitle = suggestUnDupTitle(title);
        return prev.map((change) => {
          if ("title" in change) change.title = fallbackTitle;
          return change;
        }) as Change[] | [DeletePageChange] | [PinChange];
      }
      const pending = update(page.lines, { ...page, attempts });
      const newLines = pending instanceof Promise ? await pending : pending;
      if (newLines === undefined) return [];
      if (newLines.length === 0) return [{ deleted: true }];
      return [...makeChanges(page.lines, newLines, page)];
    },
    options,
  );
