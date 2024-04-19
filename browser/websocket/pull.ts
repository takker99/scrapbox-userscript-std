import { Page } from "../../deps/scrapbox-rest.ts";
import { getPage } from "../../rest/pages.ts";

export const pull = async (
  project: string,
  title: string,
): Promise<Page> => {
  const result = await getPage(project, title);

  // TODO: 編集不可なページはStream購読だけ提供する
  if (!result.ok) {
    throw new Error(`You have no privilege of editing "/${project}/${title}".`);
  }

  return result.value;
};
