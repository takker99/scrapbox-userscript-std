import { parseSpotify } from "./spotify.ts";
import { assertSnapshot } from "@std/testing/snapshot";

Deno.test("spotify links", async (t) => {
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
