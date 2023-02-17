/// <reference lib="deno.ns" />

import { assert, assertFalse } from "../../deps/testing.ts";
import { SimpleCodeFile, isSimpleCodeFile } from "./updateCodeFile.ts";

const codeFile: SimpleCodeFile = {
  filename: "filename",
  content: ["line 0", "line 1"],
  lang: "language",
};

Deno.test("isSimpleCodeFile()", async (t) => {
  await t.step("SimpleCodeFile object", () => {
    assert(isSimpleCodeFile(codeFile));
    assert(isSimpleCodeFile({ ...codeFile, content: "line 0" }));
    assert(isSimpleCodeFile({ ...codeFile, lang: undefined }));
  });
  await t.step("similer objects", () => {
    assertFalse(isSimpleCodeFile({ ...codeFile, filename: 10 }));
    assertFalse(isSimpleCodeFile({ ...codeFile, content: 10 }));
    assertFalse(isSimpleCodeFile({ ...codeFile, content: [0, 1] }));
    assertFalse(isSimpleCodeFile({ ...codeFile, lang: 10 }));
  });
  await t.step("other type values", () => {
    assertFalse(isSimpleCodeFile(10));
    assertFalse(isSimpleCodeFile(undefined));
    assertFalse(isSimpleCodeFile(["0", "1", "2"]));
  });
});
