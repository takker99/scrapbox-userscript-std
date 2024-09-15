import { diffToChanges } from "./diffToChanges.ts";
import type { Page } from "@cosense/types/rest";
import type { Change } from "./change.ts";
import { findMetadata, getHelpfeels } from "./findMetadata.ts";
import { isSameArray } from "./isSameArray.ts";

export function* makeChanges(
  before: Page,
  after: string[],
  userId: string,
): Generator<Change, void, unknown> {
  // 改行文字が入るのを防ぐ
  const after_ = after.flatMap((text) => text.split("\n"));
  // 本文の差分を先に返す
  for (const change of diffToChanges(before.lines, after_, { userId })) {
    yield change;
  }

  // titleの差分を入れる
  // 空ページの場合もタイトル変更commitを入れる
  if (before.lines[0].text !== after_[0] || !before.persistent) {
    yield { title: after_[0] };
  }

  // descriptionsの差分を入れる
  const leftDescriptions = before.lines.slice(1, 6).map((line) => line.text);
  const rightDescriptions = after_.slice(1, 6);
  if (leftDescriptions.join("") !== rightDescriptions.join("")) {
    yield { descriptions: rightDescriptions };
  }

  // 各種メタデータの差分を入れる
  const [
    links,
    projectLinks,
    icons,
    image,
    files,
    helpfeels,
    infoboxDefinition,
  ] = findMetadata(after_.join("\n"));
  if (!isSameArray(before.links, links)) yield { links };
  if (!isSameArray(before.projectLinks, projectLinks)) yield { projectLinks };
  if (!isSameArray(before.icons, icons)) yield { icons };
  if (before.image !== image) yield { image };
  if (!isSameArray(before.files, files)) yield { files };
  if (!isSameArray(getHelpfeels(before.lines), helpfeels)) yield { helpfeels };
  if (!isSameArray(before.infoboxDefinition, infoboxDefinition)) {
    yield { infoboxDefinition };
  }
}
