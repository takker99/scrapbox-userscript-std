import { parseSpotify } from "./spotify.ts";
import { assertSnapshot } from "@std/testing/snapshot";

/** Tests for the parseSpotify function which extracts IDs from Spotify URLs
 * These tests verify that the function correctly handles various Spotify URL formats
 * and returns undefined for non-Spotify URLs
 */
Deno.test({
  name: "spotify links",
  ignore: true,
  fn: async (t) => {
  /** Test valid Spotify URLs for different content types
   * - Track URLs: /track/{id}
   * - Album URLs: /album/{id}
   * - Episode URLs: /episode/{id} (podcasts)
   * - Playlist URLs: /playlist/{id}
   * Each URL may optionally include query parameters
   */
  await t.step("is", async (t) => {
    await assertSnapshot(
      t,
      parseSpotify("https://open.spotify.com/track/0rlYL6IQIwLZwYIguyy3l0"),
    );
    await assertSnapshot(
      t,
      parseSpotify("https://open.spotify.com/album/1bgUOjg3V0a7tvEfF1N6Kk"),
    );
    await assertSnapshot(
      t,
      parseSpotify(
        "https://open.spotify.com/episode/0JtPGoprZK2WlYMjhFF2xD?si=1YLMdgNpSHOuWkaEmCAQ0g",
      ),
    );
    await assertSnapshot(
      t,
      parseSpotify(
        "https://open.spotify.com/playlist/2uOyQytSjDq9GF5z1RJj5w?si=e73cac2a2a294f7a",
      ),
    );
  });

  /** Test invalid URLs and non-Spotify content
   * Verifies that the function returns undefined for:
   * - URLs from other services (e.g., Gyazo)
   * - Plain text that looks like URLs
   * - URLs with similar patterns but from different domains
   * - Generic URLs
   */
  await t.step("is not", async (t) => {
    await assertSnapshot(
      t,
      parseSpotify(
        "https://gyazo.com/da78df293f9e83a74b5402411e2f2e01",
      ),
    );
    await assertSnapshot(
      t,
      parseSpotify(
        "ほげほげ",
      ),
    );
    await assertSnapshot(
      t,
      parseSpotify(
        "https://yourtube.com/watch?v=rafere",
      ),
    );
    await assertSnapshot(
      t,
      parseSpotify(
        "https://example.com",
      ),
    );
  });
});
