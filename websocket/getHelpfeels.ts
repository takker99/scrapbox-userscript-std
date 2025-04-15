import type { BaseLine } from "@cosense/types/userscript";

/** Extract Helpfeel entries from text
 *
 * Helpfeel is a Scrapbox notation for questions and help requests.
 * Lines starting with "?" are considered Helpfeel entries and are
 * used to collect questions and support requests within a project.
 *
 * ```ts
 * import { assertEquals } from "@std/assert/equals";
 *
 * const text = `test page
 * [normal]link
 *  but \`this [link]\` is not a link
 *
 * code:code
 *  Links [link] and images [https://scrapbox.io/files/65f29c0c9045b5002522c8bb.svg] in code blocks should be ignored
 *
 *    ? Need help with setup!!
 * `;
 *
 * assertEquals(getHelpfeels(text.split("\n").map((text) => ({ text }))), [
 *   "Need help with setup!!",
 * ]);
 * ```
 */
export const getHelpfeels = (lines: Pick<BaseLine, "text">[]): string[] =>
  lines.flatMap(({ text }) =>
    /^\s*\? .*$/.test(text) ? [text.trimStart().slice(2)] : []
  );
