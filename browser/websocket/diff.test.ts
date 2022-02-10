/// <reference lib="deno.unstable" />
import { Change, diff, ExtendedChange, toExtendedChanges } from "./diff.ts";
import { assertEquals, assertStrictEquals } from "../../deps/testing.ts";

Deno.test("diff()", async (t) => {
  await t.step("check variables", async ({ step }) => {
    await step("return arguments", () => {
      assertEquals(diff("aaa", "bbbb").from, "aaa");
      assertEquals(diff("aaa", "bbbb").to, "bbbb");
      const left = ["aaa", "bbb", 111] as const;
      const right = ["ccc", "ddd", 222] as const;
      assertStrictEquals(diff(left, right).from, left);
      assertStrictEquals(diff(left, right).to, right);
    });
  });
  await t.step("string", async ({ step }) => {
    const diffData: [string, string, Change<string>[]][] = [
      ["kitten", "sitting", [
        { value: "s", type: "added" },
        { value: "k", type: "deleted" },
        { value: "i", type: "common" },
        { value: "t", type: "common" },
        { value: "t", type: "common" },
        { value: "i", type: "added" },
        { value: "e", type: "deleted" },
        { value: "n", type: "common" },
        { value: "g", type: "added" },
      ]],
      ["sitting", "kitten", [
        { value: "s", type: "deleted" },
        { value: "k", type: "added" },
        { value: "i", type: "common" },
        { value: "t", type: "common" },
        { value: "t", type: "common" },
        { value: "i", type: "deleted" },
        { value: "e", type: "added" },
        { value: "n", type: "common" },
        { value: "g", type: "deleted" },
      ]],
    ];
    for (const [before, after, changes] of diffData) {
      await step(
        `${before}->${after}`,
        () => assertEquals([...diff(before, after).buildSES()], changes),
      );
    }
  });
});

Deno.test("toExtendedChanges()", async (t) => {
  await t.step("only", async ({ step }) => {
    await step("only added", () => {
      const before: Change<string>[] = [
        { value: "aaa", type: "added" },
        { value: "bbb", type: "added" },
        { value: "ccc", type: "added" },
      ];
      const after: ExtendedChange<string>[] = [
        { value: "aaa", type: "added" },
        { value: "bbb", type: "added" },
        { value: "ccc", type: "added" },
      ];
      assertEquals([...toExtendedChanges(before)], after);
    });
    await step("only deleted", () => {
      const before: Change<string>[] = [
        { value: "aaa", type: "deleted" },
        { value: "bbb", type: "deleted" },
        { value: "ccc", type: "deleted" },
      ];
      const after: ExtendedChange<string>[] = [
        { value: "aaa", type: "deleted" },
        { value: "bbb", type: "deleted" },
        { value: "ccc", type: "deleted" },
      ];
      assertEquals([...toExtendedChanges(before)], after);
    });
    await step("only common", () => {
      const before: Change<string>[] = [
        { value: "aaa", type: "common" },
        { value: "bbb", type: "common" },
        { value: "ccc", type: "common" },
      ];
      const after: ExtendedChange<string>[] = [
        { value: "aaa", type: "common" },
        { value: "bbb", type: "common" },
        { value: "ccc", type: "common" },
      ];
      assertEquals([...toExtendedChanges(before)], after);
    });
  });

  await t.step("mixed", async ({ step }) => {
    await step("added and deleted", () => {
      const before: Change<string>[] = [
        { value: "111", type: "added" },
        { value: "aaa", type: "added" },
        { value: "bbb", type: "deleted" },
        { value: "222", type: "added" },
        { value: "eee", type: "added" },
        { value: "fff", type: "deleted" },
        { value: "ggg", type: "deleted" },
        { value: "222", type: "added" },
        { value: "eee", type: "added" },
        { value: "ggg", type: "deleted" },
        { value: "222", type: "added" },
        { value: "fff", type: "deleted" },
        { value: "ggg", type: "deleted" },
        { value: "222", type: "added" },
        { value: "eee", type: "added" },
      ];
      const after: ExtendedChange<string>[] = [
        { value: "111", oldValue: "bbb", type: "replaced" },
        { value: "aaa", oldValue: "fff", type: "replaced" },
        { value: "222", oldValue: "ggg", type: "replaced" },
        { value: "eee", oldValue: "ggg", type: "replaced" },
        { value: "222", oldValue: "fff", type: "replaced" },
        { value: "eee", oldValue: "ggg", type: "replaced" },
        { value: "222", type: "added" },
        { value: "222", type: "added" },
        { value: "eee", type: "added" },
      ];
      assertEquals([...toExtendedChanges(before)], after);
    });
    await step("added and deleted and common", () => {
      const before: Change<string>[] = [
        { value: "111", type: "added" },
        { value: "aaa", type: "added" },
        { value: "bbb", type: "deleted" },
        { value: "ccc", type: "common" },
        { value: "ddd", type: "common" },
        { value: "222", type: "added" },
        { value: "eee", type: "added" },
        { value: "fff", type: "deleted" },
        { value: "ggg", type: "deleted" },
        { value: "ddd", type: "common" },
        { value: "222", type: "added" },
        { value: "eee", type: "added" },
        { value: "ggg", type: "deleted" },
        { value: "ddd", type: "common" },
        { value: "222", type: "added" },
        { value: "fff", type: "deleted" },
        { value: "ggg", type: "deleted" },
        { value: "ddd", type: "common" },
        { value: "222", type: "added" },
        { value: "eee", type: "added" },
        { value: "ddd", type: "common" },
        { value: "fff", type: "deleted" },
        { value: "ggg", type: "deleted" },
        { value: "ddd", type: "common" },
        { value: "222", type: "added" },
        { value: "eee", type: "added" },
        { value: "fff", type: "deleted" },
        { value: "ggg", type: "deleted" },
        { value: "222", type: "added" },
      ];
      const after: ExtendedChange<string>[] = [
        { value: "111", oldValue: "bbb", type: "replaced" },
        { value: "aaa", type: "added" },
        { value: "ccc", type: "common" },
        { value: "ddd", type: "common" },
        { value: "222", oldValue: "fff", type: "replaced" },
        { value: "eee", oldValue: "ggg", type: "replaced" },
        { value: "ddd", type: "common" },
        { value: "222", oldValue: "ggg", type: "replaced" },
        { value: "eee", type: "added" },
        { value: "ddd", type: "common" },
        { value: "222", oldValue: "fff", type: "replaced" },
        { value: "ggg", type: "deleted" },
        { value: "ddd", type: "common" },
        { value: "222", type: "added" },
        { value: "eee", type: "added" },
        { value: "ddd", type: "common" },
        { value: "fff", type: "deleted" },
        { value: "ggg", type: "deleted" },
        { value: "ddd", type: "common" },
        { value: "222", oldValue: "fff", type: "replaced" },
        { value: "eee", oldValue: "ggg", type: "replaced" },
        { value: "222", type: "added" },
      ];
      assertEquals([...toExtendedChanges(before)], after);
    });
  });
});
