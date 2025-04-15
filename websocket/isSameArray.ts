/**
 * Compare two arrays to see if they are the same.
 *
 * This function only checks each element's reference, not the content.
 *
 * ```ts
 * import { assert } from "@std/assert/assert";
 *
 * assert(isSameArray([1, 2, 3], [1, 2, 3]));
 * assert(isSameArray([1, 2, 3], [3, 2, 1]));
 * assert(!isSameArray([1, 2, 3], [3, 2, 3]));
 * assert(!isSameArray([1, 2, 3], [1, 2]));
 * assert(isSameArray([], []));
 * ```
 *
 * @param a
 * @param b
 * @returns
 */
export const isSameArray = <T>(a: T[], b: T[]): boolean =>
  a.length === b.length && a.every((x) => b.includes(x));
