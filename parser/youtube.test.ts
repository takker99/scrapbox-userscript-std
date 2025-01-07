import { parseYoutube } from "./youtube.ts";
import { assertSnapshot } from "@std/testing/snapshot";

/** Test suite for YouTube URL parsing functionality
 * This test suite verifies the parseYoutube function's ability to handle various
 * YouTube URL formats and invalid inputs using snapshot testing.
 */
Deno.test({
  name: "youtube links",
  ignore: true,
  fn: async (t) => {
  /** Test valid YouTube URL formats
   * Verifies parsing of:
   * - Standard watch URLs (youtube.com/watch?v=...)
   * - Playlist URLs (youtube.com/playlist?list=...)
   * - Watch URLs within playlists
   * - YouTube Music URLs (music.youtube.com)
   * - Short URLs (youtu.be/...)
   */
  await t.step("is", async (t) => {
    await assertSnapshot(
      t,
      parseYoutube("https://www.youtube.com/watch?v=LSvaOcaUQ3Y"),
    );
    await assertSnapshot(
      t,
      parseYoutube(
        "https://www.youtube.com/playlist?list=PLmoRDY8IgE2Okxy4WWdP95RHXOTGzJfQs",
      ),
    );
    await assertSnapshot(
      t,
      parseYoutube(
        "https://www.youtube.com/watch?v=57rdbK4vmKE&list=PLmoRDY8IgE2Okxy4WWdP95RHXOTGzJfQs",
      ),
    );
    await assertSnapshot(
      t,
      parseYoutube(
        "https://music.youtube.com/watch?v=nj1cre2e6t0",
      ),
    );
    await assertSnapshot(
      t,
      parseYoutube(
        "https://youtu.be/nj1cre2e6t0",
      ),
    );
  });

  /** Test invalid URL formats
   * Verifies that the function correctly returns undefined for:
   * - URLs from other services (e.g., Gyazo)
   * - Non-URL strings (including Japanese text)
   * - Similar but invalid domains (e.g., "yourtube.com")
   * - Generic URLs
   */
  await t.step("is not", async (t) => {
    await assertSnapshot(
      t,
      parseYoutube(
        "https://gyazo.com/da78df293f9e83a74b5402411e2f2e01",
      ),
    );
    await assertSnapshot(
      t,
      parseYoutube(
        "test_text",
      ),
    );
    await assertSnapshot(
      t,
      parseYoutube(
        "https://yourtube.com/watch?v=rafere",
      ),
    );
    await assertSnapshot(
      t,
      parseYoutube(
        "https://example.com",
      ),
    );
  });
});
