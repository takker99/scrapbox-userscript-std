import { findMetadata, getHelpfeels } from "./findMetadata.ts";
import { assertEquals } from "@std/assert";
import { assertSnapshot } from "@std/testing/snapshot";

const text = `てすと
[ふつうの]リンク
　しかし\`これは[リンク]\`ではない

code:code
 コードブロック中の[リンク]や画像[https://scrapbox.io/files/65f29c0c9045b5002522c8bb.svg]は無視される


   ? 助けてhelpfeel!!

   table:infobox
    名前	[scrapbox.icon]
    住所	[リンク2]を入れること
    電話番号	#をつけてもリンクにならないよ
    自分の強み	3個くらい列挙

#hashtag もつけるといいぞ？
[/forum-jp]のようなリンクは対象外
 [/help-jp/]もだめ
 [/icons/なるほど.icon][takker.icon]
[/help-jp/外部リンク]

サムネを用意
[https://scrapbox.io/files/65f29c24974fd8002333b160.svg]

[https://scrapbox.io/files/65e7f4413bc95600258481fb.svg https://scrapbox.io/files/65e7f82e03949c0024a367d0.svg]`;

Deno.test("findMetadata()", (t) => assertSnapshot(t, findMetadata(text)));
Deno.test("getHelpfeels()", () =>
  assertEquals(getHelpfeels(text.split("\n").map((text) => ({ text }))), [
    "助けてhelpfeel!!",
  ]));
