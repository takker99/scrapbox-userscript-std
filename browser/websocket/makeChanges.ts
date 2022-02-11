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

export interface Init {
  userId: string;
  head: HeadData;
}
export function makeChanges(
  left: Pick<Line, "text" | "id">[],
  right: string[],
  { userId, head }: Init,
) {
  // 改行文字が入るのを防ぐ
  const right_ = right.flatMap((text) => text.split("\n"));
  // 本文の差分
  const changes: Change[] = [...diffToChanges(left, right_, { userId })];

  // titleの差分を入れる
  // 空ページの場合もタイトル変更commitを入れる
  if (left[0].text !== right_[0] || !head.persistent) {
    changes.push({ title: right_[0] });
  }

  // descriptionsの差分を入れる
  const leftDescriptions = left.slice(1, 6).map((line) => line.text);
  const rightDescriptions = right_.slice(1, 6);
  if (leftDescriptions.join("") !== rightDescriptions.join("")) {
    changes.push({ descriptions: rightDescriptions });
  }

  // リンクと画像の差分を入れる
  const [linksLc, image] = findLinksAndImage(right_.join("\n"));
  if (
    head.linksLc.length !== linksLc.length ||
    !head.linksLc.every((link) => linksLc.includes(link))
  ) {
    changes.push({ links: linksLc });
  }
  if (head.image !== image) {
    changes.push({ image });
  }

  return changes;
}

/** テキストに含まれる全てのリンクと最初の画像を探す */
function findLinksAndImage(text: string): [string[], string | null] {
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

  const linksLc = [] as string[];
  let image: string | null = null;

  const lookup = (node: Node) => {
    switch (node.type) {
      case "hashTag":
        linksLc.push(toTitleLc(node.href));
        return;
      case "link": {
        if (node.pathType !== "relative") return;
        linksLc.push(toTitleLc(node.href));
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

  return [linksLc, image];
}

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
