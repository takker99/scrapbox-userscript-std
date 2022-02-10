import { encodeTitleURI, revertTitleLc, toTitleLc } from "./title.ts";
import { assertStrictEquals } from "./deps/testing.ts";

Deno.test("toTitleLc()", async (t) => {
  await t.step("` ` -> `_`", () => {
    assertStrictEquals<string>(toTitleLc("空白入り タイトル"), "空白入り_タイトル");
    assertStrictEquals<string>(
      toTitleLc(" 前後にも 空白入り _タイトル "),
      "_前後にも_空白入り__タイトル_",
    );
  });

  await t.step("upper -> lower", () => {
    assertStrictEquals<string>(toTitleLc("Scrapbox-Gyazo"), "scrapbox-gyazo");
    assertStrictEquals<string>(
      toTitleLc("全角アルファベット「Ｓｃｒａｐｂｏｘ」も変換できる"),
      "全角アルファベット「ｓｃｒａｐｂｏｘ」も変換できる",
    );
  });
  await t.step("UPPER Case -> lower_case", () => {
    assertStrictEquals<string>(
      toTitleLc("Scrapbox is one of the products powered by Nota inc."),
      "scrapbox_is_one_of_the_products_powered_by_nota_inc.",
    );
  });
});

Deno.test("revertTitleLc()", () => {
  assertStrictEquals<string>(
    revertTitleLc("Title_with underscore"),
    "Title with underscore",
  );
});

Deno.test("encodeTitleURI()", async (t) => {
  await t.step("tail symbol", () => {
    assertStrictEquals<string>(encodeTitleURI(":title:"), ":title%3A");
  });
});
