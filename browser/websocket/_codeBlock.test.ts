import { assertEquals } from "@std/assert";
import { assertSnapshot } from "@std/testing/snapshot";
import { extractFromCodeTitle } from "./_codeBlock.ts";

Deno.test("extractFromCodeTitle()", async (t) => {
  await t.step("accurate titles", async (st) => {
    const titles = [
      "code:foo.extA(extB)",
      " code:foo.extA(extB)",
      "  code: foo.extA (extB)",
      "  code: foo (extB) ",
      "  code: foo.extA ",
      "  code: foo ",
      "  code: .foo ",
    ];
    for (const title of titles) {
      await st.step(`"${title}"`, async (sst) => {
        await assertSnapshot(sst, extractFromCodeTitle(title));
      });
    }
  });

  await t.step("inaccurate titles", async (st) => {
    const nonTitles = [
      "  code: foo. ", // コードブロックにはならないので`null`が正常
      "any:code: foo ",
      " I'm not code block ",
    ];
    for (const title of nonTitles) {
      await st.step(`"${title}"`, async () => {
        await assertEquals(null, extractFromCodeTitle(title));
      });
    }
  });
});
