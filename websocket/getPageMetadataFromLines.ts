import { type Node, parse } from "@progfay/scrapbox-parser";
import type { BaseLine } from "@cosense/types/userscript";
import { toTitleLc } from "../title.ts";
import { parseYoutube } from "../parser/youtube.ts";

/** Extract metadata from Scrapbox page text
 *
 * This function parses a Scrapbox page and extracts various types of metadata:
 * - links: Regular page links and hashtags
 * - projectLinks: Links to pages in other projects
 * - icons: User icons and decorative icons
 * - image: First image or YouTube thumbnail for page preview
 * - files: Attached file IDs
 * - helpfeels: Questions or help requests (lines starting with "?")
 * - infoboxDefinition: Structured data from infobox tables
 *
 * @param text - Raw text content of a Scrapbox page
 * @returns A tuple containing [links, projectLinks, icons, image, files, helpfeels, infoboxDefinition]
 *          where image can be null if no suitable preview image is found
 */
export const getPageMetadataFromLines = (
  text: string,
): [
  title: string,
  links: string[],
  projectLinks: string[],
  icons: string[],
  image: string | null,
  descriptions: string[],
  files: string[],
  helpfeels: string[],
  infoboxDefinition: string[],
] => {
  const blocks = parse(text, { hasTitle: true });

  /** Map for detecting duplicate links while preserving link type information
   *
   * This map stores lowercase page titles and tracks their link type:
   * - true: Link is a bracket link [like this]
   * - false: Link is a hashtag #like-this
   *
   * When the same page is referenced by both formats,
   * we prioritize the bracket link format in the final output
   */
  let title = "";
  const linksLc = new Map<string, boolean>();
  const links = [] as string[];
  const projectLinksLc = new Set<string>();
  const projectLinks = [] as string[];
  const iconsLc = new Set<string>();
  const icons = [] as string[];
  let image: string | null = null;
  const descriptions = [] as string[];
  const files = new Set<string>();
  const helpfeels = new Set<string>();

  const fileUrlPattern = new RegExp(
    `${
      // For Node compatibility, we need to access `location` via `globalThis`
      // deno-lint-ignore no-explicit-any
      (globalThis as any).location?.origin ??
        "https://scrapbox.io"}/files/([a-z0-9]{24})(?:|\\.[a-zA-Z0-9]+)(?:|\\?[^\\s]*)$`,
  );

  const lookup = (node: Node) => {
    switch (node.type) {
      case "hashTag":
        if (linksLc.has(toTitleLc(node.href))) return;
        linksLc.set(toTitleLc(node.href), false);
        links.push(node.href);
        return;
      case "link":
        switch (node.pathType) {
          case "relative": {
            const link = cutId(node.href);
            if (linksLc.get(toTitleLc(link))) return;
            linksLc.set(toTitleLc(link), true);
            links.push(link);
            return;
          }
          case "root": {
            const link = cutId(node.href);
            // ignore `/project` or `/project/`
            if (/^\/[\w\d-]+\/?$/.test(link)) return;
            if (projectLinksLc.has(toTitleLc(link))) return;
            projectLinksLc.add(toTitleLc(link));
            projectLinks.push(link);
            return;
          }
          case "absolute": {
            if (node.content) return;
            const props = parseYoutube(node.href);
            if (props && props.pathType !== "list") {
              image ??= `https://i.ytimg.com/vi/${props.videoId}/mqdefault.jpg`;
              return;
            }
            const fileId = node.href.match(fileUrlPattern)?.[1];
            if (fileId) files.add(fileId);
            return;
          }
          default:
            return;
        }
      case "icon":
      case "strongIcon": {
        if (node.pathType === "root") return;
        if (iconsLc.has(toTitleLc(node.path))) return;
        iconsLc.add(toTitleLc(node.path));
        icons.push(node.path);
        return;
      }
      case "image":
      case "strongImage": {
        image ??= node.src.endsWith("/thumb/1000")
          ? node.src.replace(/\/thumb\/1000$/, "/raw")
          : node.src;
        {
          const fileId = node.src.match(fileUrlPattern)?.[1];
          if (fileId) files.add(fileId);
        }
        if (node.type === "image") {
          const fileId = node.link.match(fileUrlPattern)?.[1];
          if (fileId) files.add(fileId);
        }
        return;
      }
      case "helpfeel":
        helpfeels.add(node.text);
        return;
      case "numberList":
      case "strong":
      case "quote":
      case "decoration": {
        for (const n of node.nodes) {
          lookup(n);
        }
        return;
      }
      default:
        return;
    }
  };

  const infoboxDefinition = [] as string[];

  for (const block of blocks) {
    switch (block.type) {
      case "title": {
        title = block.text;
        continue;
      }
      case "line":
        if (descriptions.length < 5 && block.nodes.length > 0) {
          descriptions.push(
            block.nodes[0].type === "helpfeel" ||
              block.nodes[0].type === "commandLine"
              ? makeInlineCodeForDescription(block.nodes[0].raw)
              : block.nodes.map((node) => node.raw).join("").trim().slice(
                0,
                200,
              ),
          );
        }
        for (const node of block.nodes) {
          lookup(node);
        }
        continue;
      case "codeBlock":
        if (descriptions.length < 5) {
          descriptions.push(makeInlineCodeForDescription(block.content));
        }
        continue;
      case "table": {
        for (const row of block.cells) {
          for (const nodes of row) {
            for (const node of nodes) {
              lookup(node);
            }
          }
        }
        if (!["infobox", "cosense"].includes(block.fileName)) continue;
        infoboxDefinition.push(
          ...block.cells.map((row) =>
            row.map((cell) => cell.map((node) => node.raw).join("")).join("\t")
              .trim()
          ),
        );
        continue;
      }
    }
  }

  return [
    title,
    links,
    projectLinks,
    icons,
    image,
    descriptions,
    [...files],
    [...helpfeels],
    infoboxDefinition,
  ];
};

const makeInlineCodeForDescription = (text: string): `\`${string}\`` =>
  `\`${text.trim().replaceAll("`", "\\`").slice(0, 198)}\``;

const cutId = (link: string): string => link.replace(/#[a-f\d]{24,32}$/, "");

/** Extract Helpfeel entries from text
 *
 * Helpfeel is a Scrapbox notation for questions and help requests.
 * Lines starting with "?" are considered Helpfeel entries and are
 * used to collect questions and support requests within a project.
 */
export const getHelpfeels = (lines: Pick<BaseLine, "text">[]): string[] =>
  lines.flatMap(({ text }) =>
    /^\s*\? .*$/.test(text) ? [text.trimStart().slice(2)] : []
  );
