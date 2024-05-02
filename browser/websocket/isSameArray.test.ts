import { isSameArray } from "./isSameArray.ts";
import { assert } from "../../deps/testing.ts";

Deno.test("isSameArray()", () => {
  assert(isSameArray([1, 2, 3], [1, 2, 3]));
  assert(isSameArray([1, 2, 3], [3, 2, 1]));
  assert(!isSameArray([1, 2, 3], [3, 2, 3]));
  assert(!isSameArray([1, 2, 3], [1, 2]));
  assert(isSameArray([], []));
});
