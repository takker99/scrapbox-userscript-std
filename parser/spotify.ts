const spotifyRegExp =
  /https?:\/\/open\.spotify\.com\/(track|artist|playlist|album|episode|show)\/([a-zA-Z\d_-]+)(?:\?[^\s]{0,100}|)/;
export interface SpotifyProps {
  videoId: string;
  pathType: "track" | "artist" | "playlist" | "album" | "episode" | "show";
}

/** SpotifyのURLを解析してaudio IDなどを取り出す
 *
 * @param url SpotifyのURL
 * @return 解析結果 SpotifyのURLでなかったときは`undefined`を返す
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
