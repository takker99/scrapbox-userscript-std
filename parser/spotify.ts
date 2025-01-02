const spotifyRegExp =
  /https?:\/\/open\.spotify\.com\/(track|artist|playlist|album|episode|show)\/([a-zA-Z\d_-]+)(?:\?[^\s]{0,100}|)/;
/** Properties extracted from a Spotify URL
 * @property videoId - The unique identifier for the Spotify content (track, artist, playlist, etc.)
 * @property pathType - The type of content, which determines how the ID should be used:
 *   - "track": A single song or audio track
 *   - "artist": An artist's profile page
 *   - "playlist": A user-created collection of tracks
 *   - "album": A collection of tracks released as a single unit
 *   - "episode": A single podcast episode
 *   - "show": A podcast series
 */
export interface SpotifyProps {
  videoId: string;
  pathType: "track" | "artist" | "playlist" | "album" | "episode" | "show";
}

/** Parse a Spotify URL to extract content ID and type
 * 
 * This function analyzes URLs from open.spotify.com and extracts both the content ID
 * and the type of content. It supports various Spotify content types including:
 * - Tracks (songs)
 * - Artist profiles
 * - Playlists
 * - Albums
 * - Podcast episodes
 * - Podcast shows
 * 
 * The function handles URLs in the format:
 * https://open.spotify.com/{type}/{id}[?query_params]
 * 
 * @param url - The URL to parse, can be any string including non-Spotify URLs
 * @returns An object containing the content ID and type if the URL is a valid Spotify URL,
 *          undefined otherwise. For example, from "https://open.spotify.com/track/123"
 *          returns { videoId: "123", pathType: "track" }
 */
export const parseSpotify = (url: string): SpotifyProps | undefined => {
  const matches = url.match(spotifyRegExp);
  if (!matches) return undefined;

  const [, pathType, videoId] = matches;
  return {
    videoId,
    pathType,
  } as SpotifyProps;
};
