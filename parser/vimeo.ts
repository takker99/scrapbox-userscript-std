const vimeoRegExp = /https?:\/\/vimeo\.com\/([0-9]+)/i;

/** vimeoのURLからvideo IDを取得する
 *
 * @param url
 * @return video ID vimeoのURLでなければ`undefined`を返す
 */
export const parseVimeo = (url: string): string | undefined => {
  const matches = url.match(vimeoRegExp);
  if (!matches) return undefined;
  return matches[1];
};
