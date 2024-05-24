/** 等値比較用に`AddEventListenerOptions`をencodeする */
export const encode = (
  options: AddEventListenerOptions | boolean | undefined,
): number => {
  if (options === undefined) return 0;
  if (typeof options === "boolean") return Number(options);
  // 各フラグをビットにエンコードする
  return (
    (options.capture ? 1 : 0) |
    (options.once ? 2 : 0) |
    (options.passive ? 4 : 0)
  );
};
/** 等値比較用にencodeした`AddEventListenerOptions`をdecodeする
 *
 * - `capture`: `0b001`
 * - `once`: `0b010`
 * - `passive`: `0b100`
 * - `0`: `undefined`
 *
 * @param encoded `AddEventListenerOptions`をencodeした値
 * @returns `AddEventListenerOptions`または`undefined`
 */
export const decode = (
  encoded: number,
): AddEventListenerOptions | undefined => {
  if (encoded === 0) return;
  const options: AddEventListenerOptions = {};
  if (encoded & 1) options.capture = true;
  if (encoded & 2) options.once = true;
  if (encoded & 4) options.passive = true;

  return options;
};
