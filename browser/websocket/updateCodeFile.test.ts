/// <reference lib="deno.ns" />

import { assert, assertFalse } from "../../deps/testing.ts";
import { CodeFile, isCodeFile } from "./updateCodeFile.ts";

const codeFile: CodeFile = {
  filename: "filename",
  content: ["line 0", "line 1"],
  lang: "language",
};

Deno.test("isCodeFile()", async (t) => {
  await t.step("CodeFile object", () => {
    assert(isCodeFile(codeFile));
    assert(isCodeFile({ ...codeFile, content: "line 0" }));
    assert(isCodeFile({ ...codeFile, lang: undefined }));
  });
  await t.step("similer objects", () => {
    assertFalse(isCodeFile({ ...codeFile, filename: 10 }));
    assertFalse(isCodeFile({ ...codeFile, content: 10 }));
    assertFalse(isCodeFile({ ...codeFile, content: [0, 1] }));
    assertFalse(isCodeFile({ ...codeFile, lang: 10 }));
  });
  await t.step("other type values", () => {
    assertFalse(isCodeFile(10));
    assertFalse(isCodeFile(undefined));
    assertFalse(isCodeFile(["0", "1", "2"]));
  });
});
