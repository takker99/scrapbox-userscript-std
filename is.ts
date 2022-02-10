// These code are based on https://deno.land/x/unknownutil@v1.1.0/is.ts

export const isNone = (value: unknown): value is undefined | null =>
  value === null || value === undefined;
export const isString = (value: unknown): value is string =>
  typeof value === "string";
export const isNumber = (value: unknown): value is number =>
  typeof value === "number";
export const isArray = <T>(value: unknown): value is T[] =>
  Array.isArray(value);
