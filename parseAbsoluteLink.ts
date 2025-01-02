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

/** YouTube Embed Node
 * Represents a YouTube video embed with detailed information about the video
 * and its URL parameters. Supports various YouTube URL formats including
 * youtube.com, youtu.be, and YouTube Shorts.
 */
export interface YoutubeNode {
  type: "youtube";
  videoId: string;
  pathType: "com" | "dotbe" | "short";
  params: URLSearchParams;
  href: string;
  raw: string;
}

/** YouTube Playlist Embed Node
 * Represents a YouTube playlist embed. This type is specifically for
 * playlist URLs that contain a list parameter, allowing for embedding
 * entire playlists rather than single videos.
 */
export interface YoutubeListNode {
  type: "youtube";
  listId: string;
  pathType: "list";
  params: URLSearchParams;
  href: string;
  raw: string;
}

/** Vimeo Embed Node
 * Represents a Vimeo video embed. Extracts and stores the video ID
 * from Vimeo URLs for proper embedding in Scrapbox pages.
 */
export interface VimeoNode {
  type: "vimeo";
  videoId: string;
  href: string;
  raw: string;
}

/** Spotify Embed Node
 * Represents various types of Spotify content embeds including tracks,
 * artists, playlists, albums, episodes, and shows. Supports all major
 * Spotify content types for rich media integration.
 */
export interface SpotifyNode {
  type: "spotify";
  videoId: string;
  pathType: "track" | "artist" | "playlist" | "album" | "episode" | "show";
  href: string;
  raw: string;
}

/** Anchor FM Embed Node
 * Represents an Anchor FM podcast episode embed. Extracts the episode ID
 * from Anchor FM URLs to enable podcast episode playback directly within
 * Scrapbox pages.
 */
export interface AnchorFMNode {
  type: "anchor-fm";
  videoId: string;
  href: string;
  raw: string;
}

/** Generic Video Embed Node
 * Represents a direct video file embed (mp4 or webm formats).
 * Used for embedding video files that aren't from specific platforms
 * like YouTube or Vimeo.
 */
export interface VideoNode {
  type: "video";
  href: VideoURL;
  raw: string;
}

/** Generic Audio Embed Node
 * Represents a direct audio file embed supporting common formats
 * (mp3, ogg, wav, aac). Used for embedding audio content that
 * isn't from specific platforms like Spotify.
 */
export interface AudioNode {
  type: "audio";
  content: string;
  href: AudioURL;
  raw: string;
}

/** Parse external link syntax from scrapbox-parser into specific embed types
 *
 * This function analyzes external links that were initially parsed by
 * scrapbox-parser and categorizes them into specific embed types based on
 * their URLs. It supports various media platforms and file types:
 *
 * - YouTube videos and playlists
 * - Vimeo videos
 * - Spotify content (tracks, artists, playlists, etc.)
 * - Anchor FM podcast episodes
 * - Direct video files (mp4, webm)
 * - Direct audio files (mp3, ogg, wav, aac)
 * - Regular absolute links (fallback)
 *
 * The function automatically detects the appropriate embed type and returns
 * a strongly-typed object containing all necessary information for rendering
 * the embed in Scrapbox.
 *
 * @param link - Link node object from scrapbox-parser with absolute path type
 * @return - Parsed link object with specific embed type and metadata
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
