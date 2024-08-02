import { getProject, listProjects } from "./project.ts";
import { assertSnapshot } from "@std/testing/snapshot";

Deno.test("getProject", async (t) => {
  await assertSnapshot(
    t,
    getProject.toRequest("takker"),
  );
});
Deno.test("listProjects", async (t) => {
  await assertSnapshot(
    t,
    listProjects.toRequest(["dummy-id1", "dummy-id2"]),
  );
});
