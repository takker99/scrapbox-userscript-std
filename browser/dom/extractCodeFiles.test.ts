import { extractCodeFiles } from "./extractCodeFiles.ts";
import type { Line } from "@cosense/types/userscript";
import { assertSnapshot } from "@std/testing/snapshot";
import sample from "./sample-lines1.json" with { type: "json" };

Deno.test("extractCodeFiles", async (t) => {
  await assertSnapshot(
    t,
    extractCodeFiles(sample as Line[]),
  );
});
