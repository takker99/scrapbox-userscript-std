import { getIndentCount } from "./text.ts";
import { assertStrictEquals } from "./deps/testing.ts";

Deno.test("getIndentCount()", () => {
  assertStrictEquals(getIndentCount("sample text "), 0);
  assertStrictEquals(getIndentCount("  sample text "), 2);
  assertStrictEquals(getIndentCount("　　 sample text"), 3);
  assertStrictEquals(getIndentCount("\t \t　　sample text"), 5);
});
