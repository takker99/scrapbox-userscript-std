import { range } from "./range.ts";
import { assertStrictEquals } from "@std/assert";

Deno.test("range()", () => {
  let count = 0;
  for (const i of range(0, 10)) {
    assertStrictEquals<number>(i, count++);
  }
  assertStrictEquals<number>(10, count);

  count = 5;
  for (const i of range(5, 12)) {
    assertStrictEquals<number>(i, count++);
  }
  assertStrictEquals<number>(12, count);

  count = 0;
  for (const i of range(5, 5)) {
    assertStrictEquals<number>(i, count++);
  }
  assertStrictEquals<number>(0, count);
});
