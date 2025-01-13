import { getPage, listPages } from "./pages.ts";
import { assertSnapshot } from "@std/testing/snapshot";

/** Test suite for page retrieval functionality */
Deno.test("getPage", async (t) => { // Tests page fetching with various options
  // Test fetching a page with rename following enabled
  await assertSnapshot(
    t,
    getPage.toRequest("takker", "テストページ", { followRename: true }),
  );
});
/** Test suite for page listing functionality */
Deno.test("listPages", async (t) => { // Tests page listing with sorting options
  await assertSnapshot(
    t,
    listPages.toRequest("takker", { sort: "updated" }),
  );
});
