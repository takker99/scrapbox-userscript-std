/**
 * Suggest a new title that is already in use.
 *
 * ```ts
 * import { assertEquals } from "@std/assert/equals";
 *
 * assertEquals(suggestUnDupTitle("title"), "title_2");
 * assertEquals(suggestUnDupTitle("title_2"), "title_3");
 * assertEquals(suggestUnDupTitle("title_10"), "title_11");
 * assertEquals(suggestUnDupTitle("title_10_3"), "title_10_4");
 * assertEquals(suggestUnDupTitle("another_title_5"), "another_title_6");
 * ```
 *
 * @param title - The title to suggest a new name for
 * @returns
 */
export const suggestUnDupTitle = (title: string): string => {
  const matched = title.match(/(.+?)(?:_(\d+))?$/);
  const title_ = matched?.[1] ?? title;
  const num = matched?.[2] ? parseInt(matched[2]) + 1 : 2;
  return `${title_}_${num}`;
};
