import type { ErrorLike } from "./deps/scrapbox.ts";
// These code are based on https://deno.land/x/unknownutil@v1.1.0/is.ts

export const isNone = (value: unknown): value is undefined | null =>
  value === null || value === undefined;
export const isString = (value: unknown): value is string =>
  typeof value === "string";
export const isNumber = (value: unknown): value is number =>
  typeof value === "number";
export const isArray = <T>(value: unknown): value is T[] =>
  Array.isArray(value);
export const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

export const isErrorLike = (e: unknown): e is ErrorLike => {
  if (!isObject(e)) return false;
  return (e.name === undefined || typeof e.name === "string") &&
    typeof e.message === "string";
};

/** 与えられたobjectもしくはJSONテキストをErrorLikeに変換できるかどうか試す
 *
 * @param e 試したいobjectもしくはテキスト
 * @return 変換できなかったら`false`を返す。変換できたらそのobjectを返す
 */
export const tryToErrorLike = (e: unknown): false | ErrorLike => {
  try {
    const json = typeof e === "string" ? JSON.parse(e) : e;
    if (!isErrorLike(json)) return false;
    return json;
  } catch (e2: unknown) {
    if (e2 instanceof SyntaxError) return false;
    // JSONのparse error以外はそのまま投げる
    throw e2;
  }
};
