import {
  getHelpfeels,
  getPageMetadataFromLines,
} from "./getPageMetadataFromLines.ts";
import { assertEquals } from "@std/assert/equals";

// Test data for metadata extraction from a Scrapbox page
// This sample includes various Scrapbox syntax elements:
// - Regular links: [link-text]
// - Code blocks (links inside should be ignored)
// - Helpfeel notation: lines starting with "?"
// - Infobox tables
// - Hashtags
// - Project internal links: [/project/page]
// - Image links
const text = `test page
[normal]link
 but \`this [link]\` is not a link

code:code
 Links [link] and images [https://scrapbox.io/files/65f29c0c9045b5002522c8bb.svg] in code blocks should be ignored


   ? Need help with setup!!

   table:infobox
    Name	[scrapbox.icon]
    Address	Add [link2] here
    Phone	Adding # won't create a link
    Strengths	List about 3 items

#hashtag is recommended
[/forum-en] links should be excluded
 [/help-en/] too
 [/icons/example.icon][takker.icon]
[/help-en/external-link]

Prepare thumbnail
[https://scrapbox.io/files/65f29c24974fd8002333b160.svg]

[https://scrapbox.io/files/65e7f4413bc95600258481fb.svg https://scrapbox.io/files/65e7f82e03949c0024a367d0.svg]`;

Deno.test("getPageMetadataFromLines()", () => {
  assertEquals(getPageMetadataFromLines(text), [
    "test page",
    [
      "normal",
      "link2",
      "hashtag",
    ],
    [
      "/help-en/external-link",
    ],
    [
      "scrapbox",
      "takker",
    ],
    "https://scrapbox.io/files/65f29c24974fd8002333b160.svg",
    [
      "[normal]link",
      "but `this [link]` is not a link",
      "`Links [link] and images [https://scrapbox.io/files/65f29c0c9045b5002522c8bb.svg] in code blocks should be ignored`",
      "`? Need help with setup!!`",
      "#hashtag is recommended",
    ],
    [
      "65f29c24974fd8002333b160",
      "65e7f82e03949c0024a367d0",
      "65e7f4413bc95600258481fb",
    ],
    [
      "Need help with setup!!",
    ],
    [
      "Name\t[scrapbox.icon]",
      "Address\tAdd [link2] here",
      "Phone\tAdding # won't create a link",
      "Strengths\tList about 3 items",
    ],
    26,
    659,
  ]);
});

// Test Helpfeel extraction (lines starting with "?")
// These are used for collecting questions and help requests in Scrapbox
Deno.test("getHelpfeels()", () => {
  assertEquals(getHelpfeels(text.split("\n").map((text) => ({ text }))), [
    "Need help with setup!!",
  ]);
});
