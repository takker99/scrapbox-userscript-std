import { extractCodeFiles } from "./extractCodeFiles.ts";
import type { Line } from "../../deps/scrapbox.ts";
import { assertSnapshot } from "../../deps/testing.ts";
import sample from "./sample-lines1.json" with { type: "json" };

Deno.test("extractCodeFiles", async (t) => {
  await assertSnapshot(
    t,
    extractCodeFiles(sample as Line[]),
  );
});
