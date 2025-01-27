import { diffToChanges } from "./diffToChanges.ts";
import type { Page } from "@cosense/types/rest";
import type { Change } from "./change.ts";
import { getPageMetadataFromLines, getHelpfeels } from "./findMetadata.ts";
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

  // Handle title changes
  // Note: We always include title change commits for new pages (`persistent === false`)
  // to ensure proper page initialization
  if (before.lines[0].text !== after_[0] || !before.persistent) {
    yield { title: after_[0] };
  }

  // Process changes in page descriptions
  // Descriptions are the first 5 lines after the title (lines 1-5)
  // These lines provide a summary or additional context for the page
  const leftDescriptions = before.lines.slice(1, 6).map((line) => line.text);
  const rightDescriptions = after_.slice(1, 6);
  if (leftDescriptions.join("") !== rightDescriptions.join("")) {
    yield { descriptions: rightDescriptions };
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
    links,
    projectLinks,
    icons,
    image,
    files,
    helpfeels,
    infoboxDefinition,
  ] = getPageMetadataFromLines(after_.join("\n"));
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
