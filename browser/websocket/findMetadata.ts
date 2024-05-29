import { BaseLine, Node, parse } from "../../deps/scrapbox.ts";
import { toTitleLc } from "../../title.ts";
import { parseYoutube } from "../../parser/youtube.ts";

/** テキストに含まれているメタデータを取り出す
 *
 * @param text Scrapboxのテキスト
 * @return 順に、links, projectLinks, icons, image, files, helpfeels, infoboxDefinition
 */
export const findMetadata = (
  text: string,
): [
  string[],
  string[],
  string[],
  string | null,
  string[],
  string[],
  string[],
] => {
  const blocks = parse(text, { hasTitle: true }).flatMap((block) => {
    switch (block.type) {
      case "codeBlock":
      case "title":
        return [];
      case "line":
      case "table":
        return block;
    }
  });

  /** 重複判定用map
   *
   * bracket link とhashtagを区別できるようにしている
   * - bracket linkならtrue
   *
   * linkの形状はbracket linkを優先している
   */
  const linksLc = new Map<string, boolean>();
  const links = [] as string[];
  const projectLinksLc = new Set<string>();
  const projectLinks = [] as string[];
  const iconsLc = new Set<string>();
  const icons = [] as string[];
  let image: string | null = null;
  const files = new Set<string>();
  const helpfeels = new Set<string>();

  const fileUrlPattern = new RegExp(
    `${
      location?.origin ?? "https://scrapbox.io"
    }/files/([a-z0-9]{24})(?:|\\.[a-zA-Z0-9]+)(?:|\\?[^\\s]*)$`,
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
      case "line":
        for (const node of block.nodes) {
          lookup(node);
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
    links,
    projectLinks,
    icons,
    image,
    [...files],
    [...helpfeels],
    infoboxDefinition,
  ];
};

const cutId = (link: string): string => link.replace(/#[a-f\d]{24,32}$/, "");

/** テキストからHelpfeel記法のentryだけ取り出す */
export const getHelpfeels = (lines: Pick<BaseLine, "text">[]): string[] =>
  lines.flatMap(({ text }) =>
    /^\s*\? .*$/.test(text) ? [text.trimStart().slice(2)] : []
  );
