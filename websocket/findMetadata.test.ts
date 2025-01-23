import { findMetadata, getHelpfeels } from "./findMetadata.ts";
import { assertEquals } from "@std/assert";
import { assertSnapshot } from "@std/testing/snapshot";

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

// Test findMetadata function's ability to extract various metadata from a page
Deno.test("findMetadata()", (t) => assertSnapshot(t, findMetadata(text)));

// Test Helpfeel extraction (lines starting with "?")
// These are used for collecting questions and help requests in Scrapbox
Deno.test("getHelpfeels()", () => {
  assertEquals(getHelpfeels(text.split("\n").map((text) => ({ text }))), [
    "Need help with setup!!",
  ]);
});
