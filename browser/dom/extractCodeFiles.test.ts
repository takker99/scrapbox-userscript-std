import { extractCodeFiles } from "./extractCodeFiles.ts";
import { Line } from "../../deps/scrapbox.ts";
import { assertSnapshot } from "../../deps/testing.ts";
import sample from "./sample-lines1.json" assert { type: "json" };

Deno.test("extractCodeFiles", async (t) => {
  await assertSnapshot(
    t,
    extractCodeFiles(sample as Line[]),
  );
});
