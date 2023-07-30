import { diffToChanges } from "./diffToChanges.ts";
import type { Line } from "../../deps/scrapbox.ts";
import {
  Block,
  convertToBlock,
  Node,
  packRows,
  parseToRows,
} from "../../deps/scrapbox.ts";
import type { Change } from "../../deps/socket.ts";
import type { HeadData } from "./pull.ts";
import { toTitleLc } from "../../title.ts";
import { parseYoutube } from "../../parser/youtube.ts";

export interface Init {
  userId: string;
  head: HeadData;
}
export function* makeChanges(
  left: Pick<Line, "text" | "id">[],
  right: string[],
  { userId, head }: Init,
): Generator<Change, void, unknown> {
  // 改行文字が入るのを防ぐ
  const right_ = right.flatMap((text) => text.split("\n"));
  // 本文の差分を先に返す
  for (const change of diffToChanges(left, right_, { userId })) {
    yield change;
  }

  // titleの差分を入れる
  // 空ページの場合もタイトル変更commitを入れる
  if (left[0].text !== right_[0] || !head.persistent) {
    yield { title: right_[0] };
  }

  // descriptionsの差分を入れる
  const leftDescriptions = left.slice(1, 6).map((line) => line.text);
  const rightDescriptions = right_.slice(1, 6);
  if (leftDescriptions.join("") !== rightDescriptions.join("")) {
    yield { descriptions: rightDescriptions };
  }

  // リンクと画像の差分を入れる
  const [links, projectLinks, image] = findLinksAndImage(right_.join("\n"));
  if (
    head.links.length !== links.length ||
    !head.links.every((link) => links.includes(link))
  ) {
    yield { links };
  }
  if (
    head.projectLinks.length !== projectLinks.length ||
    !head.projectLinks.every((link) => projectLinks.includes(link))
  ) {
    yield { projectLinks };
  }
  if (head.image !== image) {
    yield { image };
  }
}

/** テキストに含まれる全てのリンクと最初の画像を探す */
const findLinksAndImage = (
  text: string,
): [string[], string[], string | null] => {
  const rows = parseToRows(text);
  const blocks = packRows(rows, { hasTitle: true }).flatMap((pack) => {
    switch (pack.type) {
      case "codeBlock":
      case "title":
        return [];
      case "line":
      case "table":
        return [convertToBlock(pack)];
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
  let image: string | null = null;

  const lookup = (node: Node) => {
    switch (node.type) {
      case "hashTag":
        if (linksLc.has(toTitleLc(node.href))) return;
        linksLc.set(toTitleLc(node.href), false);
        links.push(node.href);
        return;
      case "link":
        switch (node.pathType) {
          case "relative":
            if (linksLc.get(toTitleLc(node.href))) return;
            linksLc.set(toTitleLc(node.href), true);
            links.push(node.href);
            return;
          case "root":
            if (projectLinksLc.has(toTitleLc(node.href))) return;
            projectLinksLc.add(toTitleLc(node.href));
            projectLinks.push(node.href);
            return;
          case "absolute": {
            const props = parseYoutube(node.href);
            if (!props || props.pathType === "list") return;
            image ??= `https://i.ytimg.com/vi/${props.videoId}/mqdefault.jpg`;
            return;
          }
          default:
            return;
        }
      case "image":
      case "strongImage": {
        image ??= node.src.endsWith("/thumb/1000")
          ? node.src.replace(/\/thumb\/1000$/, "/raw")
          : node.src;
        return;
      }
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
  for (const node of blocksToNodes(blocks)) {
    lookup(node);
  }

  return [links, projectLinks, image];
};

function* blocksToNodes(blocks: Iterable<Block>) {
  for (const block of blocks) {
    switch (block.type) {
      case "codeBlock":
      case "title":
        continue;
      case "line":
        for (const node of block.nodes) {
          yield node;
        }
        continue;
      case "table": {
        for (const row of block.cells) {
          for (const nodes of row) {
            for (const node of nodes) {
              yield node;
            }
          }
        }
        continue;
      }
    }
  }
}
