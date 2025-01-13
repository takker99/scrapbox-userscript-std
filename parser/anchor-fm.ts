const AnchorFMRegExp =
  /https?:\/\/anchor\.fm\/[a-zA-Z\d_-]+\/episodes\/([a-zA-Z\d_-]+(?:\/[a-zA-Z\d_-]+)?)(?:\?[^\s]{0,100}|)/;

/** Extract the episode ID from an Anchor FM URL
 *
 * This function parses Anchor FM podcast episode URLs and extracts their unique
 * episode identifiers. It supports various Anchor FM URL formats including:
 * - https://anchor.fm/[show]/episodes/[episode-id]
 * - https://anchor.fm/[show]/episodes/[episode-id]/[additional-path]
 * - https://anchor.fm/[show]/episodes/[episode-id]?[query-params]
 *
 * @param url - The URL to parse, can be any string including non-Anchor FM URLs
 * @returns A {@linkcode Result}<{@linkcode string}, {@linkcode undefined}> containing:
 *          - Success: The episode ID (e.g., "abc123" from "https://anchor.fm/show/episodes/abc123")
 *          - Error: {@linkcode undefined} if not a valid Anchor FM URL
 */
export const parseAnchorFM = (url: string): string | undefined => {
  const matches = url.match(AnchorFMRegExp);
  if (!matches) return undefined;

  const [, videoId] = matches;
  return videoId;
};
