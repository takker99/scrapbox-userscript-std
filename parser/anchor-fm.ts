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
 * @returns The episode ID if the URL matches the Anchor FM pattern, undefined otherwise.
 *         For example, from "https://anchor.fm/show/episodes/abc123" returns "abc123"
 */
export const parseAnchorFM = (url: string): string | undefined => {
  const matches = url.match(AnchorFMRegExp);
  if (!matches) return undefined;

  const [, videoId] = matches;
  return videoId;
};
