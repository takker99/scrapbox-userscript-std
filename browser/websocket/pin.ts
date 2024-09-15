import type { Result } from "option-t/plain_result";
import type { Change } from "./change.ts";
import { push, type PushError, type PushOptions } from "./push.ts";

export interface PinOptions extends PushOptions {
  /** ピン留め対象のページが存在しないときの振る舞いを変えるoption
   *
   * -`true`: タイトルのみのページを作成してピン留めする
   * - `false`: ピン留めしない
   *
   * @default false
   */
  create?: boolean;
}
/** 指定したページをピン留めする
 *
 * @param project ピン留めしたいページのproject
 * @param title ピン留めしたいページのタイトル
 * @param options 使用したいSocketがあれば指定する
 */
export const pin = (
  project: string,
  title: string,
  options?: PinOptions,
): Promise<Result<string, PushError>> =>
  push(
    project,
    title,
    (page) => {
      // 既にピン留めされている場合は何もしない
      if (
        page.pin > 0 || (!page.persistent && !(options?.create ?? false))
      ) return [];
      // @ts-ignore 多分ページ作成とピン留めを同時に行っても怒られない……はず
      const changes: Change[] = [{ pin: pinNumber() }] as Change[];
      if (!page.persistent) changes.unshift({ title });
      return changes;
    },
    options,
  );

export interface UnPinOptions extends PushOptions {}
/** 指定したページのピン留めを外す
 *
 * @param project ピン留めを外したいページのproject
 * @param title ピン留めを外したいページのタイトル
 */
export const unpin = (
  project: string,
  title: string,
  options: UnPinOptions,
): Promise<Result<string, PushError>> =>
  push(
    project,
    title,
    (page) =>
      // 既にピンが外れているか、そもそも存在しないページの場合は何もしない
      page.pin == 0 || !page.persistent ? [] : [{ pin: 0 }],
    options,
  );

export const pinNumber = (): number =>
  Number.MAX_SAFE_INTEGER - Math.floor(Date.now() / 1000);
