import { parseVimeo } from "./vimeo.ts";
import { assertSnapshot } from "../deps/testing.ts";

Deno.test("vimeo links", async (t) => {
  await t.step("is", async (t) => {
    await assertSnapshot(
      t,
      parseVimeo("https://vimeo.com/121284607"),
    );
  });

  await t.step("is not", async (t) => {
    await assertSnapshot(
      t,
      parseVimeo(
        "https://gyazo.com/da78df293f9e83a74b5402411e2f2e01",
      ),
    );
    await assertSnapshot(
      t,
      parseVimeo(
        "ほげほげ",
      ),
    );
    await assertSnapshot(
      t,
      parseVimeo(
        "https://yourtube.com/watch?v=rafere",
      ),
    );
    await assertSnapshot(
      t,
      parseVimeo(
        "https://example.com",
      ),
    );
  });
});
