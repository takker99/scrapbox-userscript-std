import { parseAnchorFM } from "./anchor-fm.ts";
import { assertSnapshot } from "../deps/testing.ts";

Deno.test("spotify links", async (t) => {
  await t.step("is", async (t) => {
    await assertSnapshot(
      t,
      parseAnchorFM(
        "https://anchor.fm/notainc/episodes/1-FM-e1gh6a7/a-a7m2veg",
      ),
    );
  });

  await t.step("is not", async (t) => {
    await assertSnapshot(
      t,
      parseAnchorFM(
        "https://gyazo.com/da78df293f9e83a74b5402411e2f2e01",
      ),
    );
    await assertSnapshot(
      t,
      parseAnchorFM(
        "ほげほげ",
      ),
    );
    await assertSnapshot(
      t,
      parseAnchorFM(
        "https://yourtube.com/watch?v=rafere",
      ),
    );
    await assertSnapshot(
      t,
      parseAnchorFM(
        "https://example.com",
      ),
    );
  });
});
