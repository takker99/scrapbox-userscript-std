import { diffToChanges } from "./diffToChanges.ts";
import type { Page } from "@cosense/types/rest";
import type { Change } from "./change.ts";
import { getHelpfeels, getPageMetadataFromLines } from "./getPageMetadataFromLines.ts";
import { isSameArray } from "./isSameArray.ts";
import { isString } from "@core/unknownutil/is/string";

export function* makeChanges(
  before: Page,
  after: (string | { text: string })[],
  userId: string,
): Generator<Change, void, unknown> {
  // Prevent newline characters from being included in the text
  // This ensures consistent line handling across different platforms
  const after_ = after.flatMap((text) =>
    (isString(text) ? text : text.text).split("\n")
  );

  // First, yield changes in the main content
  // Content changes must be processed before metadata to maintain consistency
  for (const change of diffToChanges(before.lines, after_, { userId })) {
    yield change;
  }

  // Process changes in various metadata
  // Metadata includes:
  // - links: References to other pages
  // - projectLinks: Links to other Scrapbox projects
  // - icons: Page icons or thumbnails
  // - image: Main page image
  // - files: Attached files
  // - helpfeels: Questions or help requests (lines starting with "?")
  // - infoboxDefinition: Structured data definitions
  const [
    title,
    links,
    projectLinks,
    icons,
    image,
    descriptions,
    files,
    helpfeels,
    infoboxDefinition,
  ] = getPageMetadataFromLines(after_.join("\n"));
  // Handle title changes
  // Note: We always include title change commits for new pages (`persistent === false`)
  // to ensure proper page initialization
  if (before.title !== title || !before.persistent) yield { title };
  if (!isSameArray(before.links, links)) yield { links };
  if (!isSameArray(before.projectLinks, projectLinks)) yield { projectLinks };
  if (!isSameArray(before.icons, icons)) yield { icons };
  if (before.image !== image) yield { image };
  if (!isSameArray(before.descriptions, descriptions)) yield { descriptions };
  if (!isSameArray(before.files, files)) yield { files };
  if (!isSameArray(getHelpfeels(before.lines), helpfeels)) yield { helpfeels };
  if (!isSameArray(before.infoboxDefinition, infoboxDefinition)) {
    yield { infoboxDefinition };
  }
}
