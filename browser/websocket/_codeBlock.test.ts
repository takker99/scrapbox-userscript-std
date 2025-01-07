import { assertEquals } from "@std/assert";
import { assertSnapshot } from "@std/testing/snapshot";
import { extractFromCodeTitle } from "./_codeBlock.ts";

/**
 * Tests for code block title parsing functionality
 *
 * These tests verify the parsing of code block titles in various formats:
 * - Valid formats: code:filename.ext(param), code:filename(param), code:filename.ext
 * - Invalid formats: trailing dots, incorrect prefixes, non-code blocks
 */
Deno.test("extractFromCodeTitle()", async (t) => {
  await t.step("accurate titles", async (st) => {
    const titles = [
      "code:foo.extA(extB)", // Basic format: no spaces
      " code:foo.extA(extB)", // Leading space before code:
      "  code: foo.extA (extB)", // Spaces around components
      "  code: foo (extB) ", // Extension omitted, has parameter
      "  code: foo.extA ", // Extension only, no parameter
      "  code: foo ", // Basic name only
      "  code: .foo ", // Leading dot in name
    ];
    for (const title of titles) {
      await st.step(`"${title}"`, async (sst) => {
        await assertSnapshot(sst, extractFromCodeTitle(title));
      });
    }
  });

  await t.step("inaccurate titles", async (st) => {
    const nonTitles = [
      "  code: foo. ", // Invalid: Trailing dot without extension is not a valid code block format
      // Returning `null` is expected as this format is invalid
      "any:code: foo ", // Invalid: Must start with exactly "code:" prefix
      " I'm not code block ", // Invalid: Not a code block format at all
    ];
    for (const title of nonTitles) {
      await st.step(`"${title}"`, async () => {
        await assertEquals(null, extractFromCodeTitle(title));
      });
    }
  });
});
