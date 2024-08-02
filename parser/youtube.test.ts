import { parseYoutube } from "./youtube.ts";
import { assertSnapshot } from "@std/testing/snapshot";

Deno.test("youtube links", async (t) => {
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
        "ほげほげ",
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
