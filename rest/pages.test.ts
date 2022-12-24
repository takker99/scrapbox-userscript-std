import { getPage, listPages } from "./pages.ts";
import { assertSnapshot } from "../deps/testing.ts";

Deno.test("getPage", async (t) => {
  await assertSnapshot(
    t,
    getPage.toRequest("takker", "テストページ", { followRename: true }),
  );
});
Deno.test("listPages", async (t) => {
  await assertSnapshot(
    t,
    listPages.toRequest("takker", { sort: "updated" }),
  );
});
