import { diffToChanges } from "./diffToChanges.ts";
import { assertEquals } from "../../deps/testing.ts";

Deno.test("diffToChanges()", async ({ step }) => {
  const userId = "xxxyyy";
  await step("append", () => {
    const before: Parameters<typeof diffToChanges>[0] = [
      {
        text: "caption",
        id: "aaa",
      },
    ];
    const after = [
      "caption",
      "",
      " new line",
    ];
    const changes = [
      ...removeRandamId(diffToChanges(before, after, { userId })),
    ];
    assertEquals(
      changes,
      [
        { _insert: "_end", lines: { text: "" } },
        { _insert: "_end", lines: { text: " new line" } },
      ],
    );
  });

  await step("update", () => {
    const before: Parameters<typeof diffToChanges>[0] = [
      {
        text: "caption",
        id: "aaa",
      },
      {
        text: "",
        id: "bbb",
      },
      {
        text: " new line",
        id: "ccc",
      },
    ];
    const after = [
      "caption",
      "update",
      " new line updated",
    ];
    const changes = [
      ...removeRandamId(diffToChanges(before, after, { userId })),
    ];
    assertEquals(
      changes,
      [
        { _update: "bbb", lines: { text: "update" } },
        { _update: "ccc", lines: { text: " new line updated" } },
      ],
    );
  });

  await step("insert", () => {
    const before: Parameters<typeof diffToChanges>[0] = [
      {
        text: "caption",
        id: "aaa",
      },
      {
        text: "",
        id: "bbb",
      },
      {
        text: " new line",
        id: "ccc",
      },
    ];
    const after = [
      "caption",
      "",
      " inserted line",
      " more inserted line",
      " new line",
    ];
    const changes = [
      ...removeRandamId(diffToChanges(before, after, { userId })),
    ];
    assertEquals(
      changes,
      [
        { _insert: "ccc", lines: { text: " inserted line" } },
        { _insert: "ccc", lines: { text: " more inserted line" } },
      ],
    );
  });

  await step("append and update", () => {
    const before: Parameters<typeof diffToChanges>[0] = [
      {
        text: "caption",
        id: "aaa",
      },
      {
        text: "",
        id: "bbb",
      },
      {
        text: " new line",
        id: "ccc",
      },
    ];
    const after = [
      "caption",
      "",
      " old line",
      " more new line",
    ];
    const changes = [
      ...removeRandamId(diffToChanges(before, after, { userId })),
    ];
    assertEquals(
      changes,
      [
        { _update: "ccc", lines: { text: " old line" } },
        { _insert: "_end", lines: { text: " more new line" } },
      ],
    );
  });
  await step("update and insert", () => {
    const before: Parameters<typeof diffToChanges>[0] = [
      {
        text: "caption",
        id: "aaa",
      },
      {
        text: "",
        id: "bbb",
      },
      {
        text: " new line",
        id: "ccc",
      },
    ];
    const after = [
      "caption",
      " update",
      " old line",
      " more new line",
    ];
    const changes = [
      ...removeRandamId(diffToChanges(before, after, { userId })),
    ];
    assertEquals(
      changes,
      [
        { _update: "bbb", lines: { text: " update" } },
        { _update: "ccc", lines: { text: " old line" } },
        { _insert: "_end", lines: { text: " more new line" } },
      ],
    );
  });
  await step("insert and update", () => {
    const before: Parameters<typeof diffToChanges>[0] = [
      {
        text: "caption",
        id: "aaa",
      },
      {
        text: "",
        id: "bbb",
      },
      {
        text: " new line",
        id: "ccc",
      },
    ];
    const after = [
      "caption",
      " inserted",
      "",
      " more inserted",
      " new line",
      "appended",
      "more appended",
    ];
    const changes = [
      ...removeRandamId(diffToChanges(before, after, { userId })),
    ];
    assertEquals(
      changes,
      [
        { _insert: "bbb", lines: { text: " inserted" } },
        { _insert: "ccc", lines: { text: " more inserted" } },
        { _insert: "_end", lines: { text: "appended" } },
        { _insert: "_end", lines: { text: "more appended" } },
      ],
    );
  });
});

function* removeRandamId(changes: ReturnType<typeof diffToChanges>) {
  for (const change of changes) {
    if ("_insert" in change) {
      yield { _insert: change._insert, lines: { text: change.lines.text } };
      continue;
    }
    yield change;
  }
}
