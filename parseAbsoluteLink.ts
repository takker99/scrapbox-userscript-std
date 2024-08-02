/** Parse `LinkNode` of [@progfay/scrapbox-parser](https://jsr.io/@progfay/scrapbox-parser) in detail
 *
 * @module
 */

import type { LinkNode } from "@progfay/scrapbox-parser";
import { parseYoutube } from "./parser/youtube.ts";
import { parseVimeo } from "./parser/vimeo.ts";
import { parseSpotify } from "./parser/spotify.ts";
import { parseAnchorFM } from "./parser/anchor-fm.ts";

export type { LinkNode };

export interface AbsoluteLinkNode {
  type: "absoluteLink";
  content: string;
  href: string;
  raw: string;
}

/** Youtube埋め込み */
export interface YoutubeNode {
  type: "youtube";
  videoId: string;
  pathType: "com" | "dotbe" | "short";
  params: URLSearchParams;
  href: string;
  raw: string;
}

/** Youtube List埋め込み */
export interface YoutubeListNode {
  type: "youtube";
  listId: string;
  pathType: "list";
  params: URLSearchParams;
  href: string;
  raw: string;
}

/** Vimeo埋め込み */
export interface VimeoNode {
  type: "vimeo";
  videoId: string;
  href: string;
  raw: string;
}

/** Spotify埋め込み */
export interface SpotifyNode {
  type: "spotify";
  videoId: string;
  pathType: "track" | "artist" | "playlist" | "album" | "episode" | "show";
  href: string;
  raw: string;
}

/** Anchor FM埋め込み */
export interface AnchorFMNode {
  type: "anchor-fm";
  videoId: string;
  href: string;
  raw: string;
}

/** 動画埋め込み */
export interface VideoNode {
  type: "video";
  href: VideoURL;
  raw: string;
}

/** 音声埋め込み */
export interface AudioNode {
  type: "audio";
  content: string;
  href: AudioURL;
  raw: string;
}

/** scrapbox-parserで解析した外部リンク記法を、埋め込み形式ごとに細かく解析する
 *
 * @param link scrapbox-parserで解析した外部リンク記法のobject
 * @return 解析した記法のobject
 */
export const parseAbsoluteLink = (
  link: LinkNode & { pathType: "absolute" },
):
  | AbsoluteLinkNode
  | VideoNode
  | AudioNode
  | YoutubeNode
  | YoutubeListNode
  | VimeoNode
  | SpotifyNode
  | AnchorFMNode => {
  const { type: _, pathType: __, content, href, ...baseLink } = link;
  if (content === "") {
    const youtube = parseYoutube(href);
    if (youtube) return { type: "youtube", href, ...youtube, ...baseLink };

    const vimeoId = parseVimeo(href);
    if (vimeoId) return { type: "vimeo", videoId: vimeoId, href, ...baseLink };

    const spotify = parseSpotify(href);
    if (spotify) return { type: "spotify", href, ...spotify, ...baseLink };

    const anchorFMId = parseAnchorFM(href);
    if (anchorFMId) {
      return { type: "anchor-fm", videoId: anchorFMId, href, ...baseLink };
    }

    if (isVideoURL(href)) return { type: "video", href, ...baseLink };
  }
  if (isAudioURL(href)) return { type: "audio", content, href, ...baseLink };

  return { type: "absoluteLink", content, href, ...baseLink };
};

export type AudioURL = `${string}.${"mp3" | "ogg" | "wav" | "acc"}`;
const isAudioURL = (url: string): url is AudioURL =>
  /\.(?:mp3|ogg|wav|aac)$/.test(url);

export type VideoURL = `${string}.${"mp4" | "webm"}`;
const isVideoURL = (url: string): url is VideoURL =>
  /\.(?:mp4|webm)$/.test(url);
