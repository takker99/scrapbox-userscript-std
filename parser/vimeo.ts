const vimeoRegExp = /https?:\/\/vimeo\.com\/([0-9]+)/i;

/** Extract the video ID from a Vimeo URL
 *
 * This function parses Vimeo video URLs to extract their numeric video IDs.
 * Vimeo uses a simple URL structure where each video has a unique numeric ID:
 * https://vimeo.com/{video_id}
 *
 * For example:
 * - https://vimeo.com/123456789 -> returns "123456789"
 * - https://vimeo.com/groups/123 -> returns undefined (not a video URL)
 * - https://vimeo.com/channels/123 -> returns undefined (not a video URL)
 *
 * @param url - The URL to parse, can be any string including non-Vimeo URLs
 * @returns The numeric video ID if the URL matches the Vimeo video pattern,
 *          undefined otherwise
 */
export const parseVimeo = (url: string): string | undefined => {
  const matches = url.match(vimeoRegExp);
  if (!matches) return undefined;
  return matches[1];
};
