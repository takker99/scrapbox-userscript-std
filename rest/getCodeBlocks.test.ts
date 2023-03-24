/// <reference lib="deno.ns" />

import { Line } from "../deps/scrapbox-rest.ts";
import { assertEquals, assertSnapshot } from "../deps/testing.ts";
import { getCodeBlocks } from "./getCodeBlocks.ts";

// https://scrapbox.io/takker/コードブロック記法
const project = "takker";
const title = "コードブロック記法";
const sample: Line[] = [
  {
    "id": "63b7aeeb5defe7001ddae116",
    "text": "コードブロック記法",
    "userId": "5ef2bdebb60650001e1280f0",
    "created": 1672982645,
    "updated": 1672982645,
  },
  {
    "id": "63b7b0761280f00000c9bc21",
    "text": "ここでは[コードブロック]を表現する[scrapbox記法]を示す",
    "userId": "5ef2bdebb60650001e1280f0",
    "created": 1672982645,
    "updated": 1672982671,
  },
  {
    "id": "63b7b0791280f00000c9bc22",
    "text": "",
    "userId": "5ef2bdebb60650001e1280f0",
    "created": 1672982648,
    "updated": 1672982648,
  },
  {
    "id": "63b7b12b1280f00000c9bc3d",
    "text": "サンプル",
    "userId": "5ef2bdebb60650001e1280f0",
    "created": 1672982826,
    "updated": 1672982828,
  },
  {
    "id": "63b7b12c1280f00000c9bc3e",
    "text": " from [/villagepump/記法サンプル#61dd289e7838e30000dc9cb5]",
    "userId": "5ef2bdebb60650001e1280f0",
    "created": 1672982828,
    "updated": 1672982835,
  },
  {
    "id": "63b7b1261280f00000c9bc26",
    "text": "code:コードブロック.py",
    "userId": "5ef2bdebb60650001e1280f0",
    "created": 1672982821,
    "updated": 1672982822,
  },
  {
    "id": "63b7b1261280f00000c9bc27",
    "text": ' print("Hello World!")',
    "userId": "5ef2bdebb60650001e1280f0",
    "created": 1672982822,
    "updated": 1672982822,
  },
  {
    "id": "63b7b1261280f00000c9bc28",
    "text": "無名コードブロック",
    "userId": "5ef2bdebb60650001e1280f0",
    "created": 1672982822,
    "updated": 1672983021,
  },
  {
    "id": "63b7b1261280f00000c9bc29",
    "text": "code:py",
    "userId": "5ef2bdebb60650001e1280f0",
    "created": 1672982822,
    "updated": 1672982822,
  },
  {
    "id": "63b7b1261280f00000c9bc2a",
    "text": ' print("Hello World!")',
    "userId": "5ef2bdebb60650001e1280f0",
    "created": 1672982822,
    "updated": 1672982822,
  },
  {
    "id": "63b7b1261280f00000c9bc2b",
    "text": "インデントつき",
    "userId": "5ef2bdebb60650001e1280f0",
    "created": 1672982822,
    "updated": 1672982822,
  },
  {
    "id": "63b7b1261280f00000c9bc2c",
    "text": " code:インデント.md",
    "userId": "5ef2bdebb60650001e1280f0",
    "created": 1672982822,
    "updated": 1672982822,
  },
  {
    "id": "63b7b1261280f00000c9bc2d",
    "text": "  - インデント\r",
    "userId": "5ef2bdebb60650001e1280f0",
    "created": 1672982822,
    "updated": 1672982822,
  },
  {
    "id": "63b7b1261280f00000c9bc2e",
    "text": "    - インデント",
    "userId": "5ef2bdebb60650001e1280f0",
    "created": 1672982822,
    "updated": 1672982822,
  },
  {
    "id": "63b7b1261280f00000c9bc2f",
    "text": "言語を強制",
    "userId": "5ef2bdebb60650001e1280f0",
    "created": 1672982822,
    "updated": 1672982822,
  },
  {
    "id": "63b7b1261280f00000c9bc30",
    "text": " code:python(js)",
    "userId": "5ef2bdebb60650001e1280f0",
    "created": 1672982822,
    "updated": 1672982822,
  },
  {
    "id": "63b7b1261280f00000c9bc31",
    "text": '  console.log("I\'m JavaScript");',
    "userId": "5ef2bdebb60650001e1280f0",
    "created": 1672982822,
    "updated": 1672982822,
  },
  {
    "id": "63b7b1261280f00000c9bc32",
    "text": "文芸的プログラミング",
    "userId": "5ef2bdebb60650001e1280f0",
    "created": 1672982822,
    "updated": 1672982825,
  },
  {
    "id": "63b7b1261280f00000c9bc33",
    "text": " 標準ヘッダファイルをインクルード",
    "userId": "5ef2bdebb60650001e1280f0",
    "created": 1672982822,
    "updated": 1672982822,
  },
  {
    "id": "63b7b1261280f00000c9bc34",
    "text": "  code:main.cpp",
    "userId": "5ef2bdebb60650001e1280f0",
    "created": 1672982822,
    "updated": 1672982822,
  },
  {
    "id": "63b7b1261280f00000c9bc35",
    "text": "   #include <iostream>",
    "userId": "5ef2bdebb60650001e1280f0",
    "created": 1672982822,
    "updated": 1672982822,
  },
  {
    "id": "63b7b1261280f00000c9bc36",
    "text": "   ",
    "userId": "5ef2bdebb60650001e1280f0",
    "created": 1672982822,
    "updated": 1672982822,
  },
  {
    "id": "63b7b1261280f00000c9bc37",
    "text": " main函数の定義",
    "userId": "5ef2bdebb60650001e1280f0",
    "created": 1672982822,
    "updated": 1672982822,
  },
  {
    "id": "63b7b1261280f00000c9bc38",
    "text": "  code:main.cpp",
    "userId": "5ef2bdebb60650001e1280f0",
    "created": 1672982822,
    "updated": 1672982822,
  },
  {
    "id": "63b7b1261280f00000c9bc39",
    "text": "   int main() {",
    "userId": "5ef2bdebb60650001e1280f0",
    "created": 1672982822,
    "updated": 1672982822,
  },
  {
    "id": "63b7b1261280f00000c9bc3a",
    "text":
      '     std::cout << "Hello, C++" << "from scrapbox.io" << std::endl;',
    "userId": "5ef2bdebb60650001e1280f0",
    "created": 1672982822,
    "updated": 1672982822,
  },
  {
    "id": "63b7b1261280f00000c9bc3b",
    "text": "   }",
    "userId": "5ef2bdebb60650001e1280f0",
    "created": 1672982822,
    "updated": 1672982822,
  },
  {
    "id": "63b7b1261280f00000c9bc3c",
    "text": "   ",
    "userId": "5ef2bdebb60650001e1280f0",
    "created": 1672982822,
    "updated": 1672982822,
  },
  {
    "id": "63b7b0911280f00000c9bc23",
    "text": "",
    "userId": "5ef2bdebb60650001e1280f0",
    "created": 1672982673,
    "updated": 1672982673,
  },
  {
    "id": "63b7b0911280f00000c9bc24",
    "text": "#2023-01-06 14:24:35 ",
    "userId": "5ef2bdebb60650001e1280f0",
    "created": 1672982673,
    "updated": 1672982674,
  },
  {
    "id": "63b7b0931280f00000c9bc25",
    "text": "",
    "userId": "5ef2bdebb60650001e1280f0",
    "created": 1672982674,
    "updated": 1672982674,
  },
];

Deno.test("getCodeBlocks()", async (t) => {
  await assertSnapshot(
    t,
    await getCodeBlocks({ project, title, lines: sample }),
  );
  await t.step("filename filter", async (st) => {
    const filename = "インデント.md";
    const codeBlocks = await getCodeBlocks({ project, title, lines: sample }, {
      filename,
    });
    const yet = [];
    for (const codeBlock of codeBlocks) {
      yet.push(assertEquals(codeBlock.filename, filename));
    }
    await Promise.all(yet);
    await assertSnapshot(st, codeBlocks);
  });
  await t.step("language name filter", async (st) => {
    const lang = "py";
    const codeBlocks = await getCodeBlocks({ project, title, lines: sample }, {
      lang,
    });
    const yet = [];
    for (const codeBlock of codeBlocks) {
      yet.push(assertEquals(codeBlock.lang, lang));
    }
    await Promise.all(yet);
    await assertSnapshot(st, codeBlocks);
  });
  await t.step("title line ID filter", async (st) => {
    const titleLineId = "63b7b1261280f00000c9bc34";
    const codeBlocks = await getCodeBlocks({ project, title, lines: sample }, {
      titleLineId,
    });
    const yet = [];
    for (const codeBlock of codeBlocks) {
      yet.push(assertEquals(codeBlock.titleLine.id, titleLineId));
    }
    await Promise.all(yet);
    await assertSnapshot(st, codeBlocks);
  });
});
