const AnchorFMRegExp =
  /https?:\/\/anchor\.fm\/[a-zA-Z\d_-]+\/episodes\/([a-zA-Z\d_-]+(?:\/[a-zA-Z\d_-]+)?)(?:\?[^\s]{0,100}|)/;

/** anchorFMのURLからIDを取得する
 *
 * @param url
 * @return ID anchorFMのURLでなければ`undefined`を返す
 */
export const parseAnchorFM = (url: string): string | undefined => {
  const matches = url.match(AnchorFMRegExp);
  if (!matches) return undefined;

  const [, videoId] = matches;
  return videoId;
};
