import {
  encodeTitleURI,
  revertTitleLc,
  toReadableTitleURI,
  toTitleLc,
} from "./title.ts";
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

Deno.test("toReadableTitleURI()", async (t) => {
  await t.step("only \\w", () => {
    assertStrictEquals<string>(
      toReadableTitleURI("Normal_TitleAAA"),
      "Normal_TitleAAA",
    );
  });

  await t.step("with sparce", () => {
    assertStrictEquals<string>(
      toReadableTitleURI("Title with Spaces"),
      "Title_with_Spaces",
    );
  });

  await t.step("with multibyte characters", () => {
    assertStrictEquals<string>(
      toReadableTitleURI("日本語_(絵文字✨つき)　タイトル"),
      "日本語_(絵文字✨つき)　タイトル",
    );
  });

  await t.step("encoding //", () => {
    assertStrictEquals<string>(
      toReadableTitleURI("スラッシュ/は/percent encoding対象の/文字です"),
      "スラッシュ%2Fは%2Fpercent_encoding対象の%2F文字です",
    );
    assertStrictEquals<string>(
      toReadableTitleURI("%2Fなども/と同様percent encodingされる"),
      "%252Fなども%2Fと同様percent_encodingされる",
    );
  });
});
