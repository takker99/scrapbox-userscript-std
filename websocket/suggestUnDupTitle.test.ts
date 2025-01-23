import { suggestUnDupTitle } from "./suggestUnDupTitle.ts";
import { assertEquals } from "@std/assert";

Deno.test("suggestUnDupTitle()", () => {
  assertEquals(suggestUnDupTitle("title"), "title_2");
  assertEquals(suggestUnDupTitle("title_2"), "title_3");
  assertEquals(suggestUnDupTitle("title_10"), "title_11");
  assertEquals(suggestUnDupTitle("title_10_3"), "title_10_4");
  assertEquals(suggestUnDupTitle("another_title_5"), "another_title_6");
});
