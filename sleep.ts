/** ミリ秒単位で待つ
 *
 * @param milliseconds 待ち時間 (ミリ秒)
 */
export const sleep = (milliseconds: number): Promise<void> =>
  new Promise<void>((resolve) => setTimeout(() => resolve(), milliseconds));
