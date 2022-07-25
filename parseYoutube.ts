// ported from https://github.com/takker99/ScrapBubble/blob/0.4.0/Page.tsx#L662

export interface YoutubeProps {
  params: URLSearchParams;
  videoId: string;
}

const youtubeRegExp =
  /https?:\/\/(?:www\.|)youtube\.com\/watch\?((?:[^\s]+&|)v=([a-zA-Z\d_-]+)(?:&[^\s]+|))/;
const youtubeShortRegExp =
  /https?:\/\/youtu\.be\/([a-zA-Z\d_-]+)(?:\?([^\s]{0,100})|)/;
const youtubeListRegExp =
  /https?:\/\/(?:www\.|)youtube\.com\/playlist\?((?:[^\s]+&|)list=([a-zA-Z\d_-]+)(?:&[^\s]+|))/;

/** YoutubeのURLを解析してVideo IDなどを取り出す
 *
 * @param url YoutubeのURL
 * @return 解析結果 YoutubeのURLでなかったときは`undefined`を返す
 */
export const parseYoutube = (url: string): YoutubeProps | undefined => {
  {
    const matches = url.match(youtubeRegExp);
    if (matches) {
      const [, params, videoId] = matches;
      const _params = new URLSearchParams(params);
      _params.delete("v");
      _params.append("autoplay", "0");
      return {
        videoId,
        params: _params,
      };
    }
  }
  {
    const matches = url.match(youtubeShortRegExp);
    if (matches) {
      const [, videoId] = matches;
      return {
        videoId,
        params: new URLSearchParams("autoplay=0"),
      };
    }
  }
  {
    const matches = url.match(youtubeListRegExp);
    if (matches) {
      const [, params, listId] = matches;

      const _params = new URLSearchParams(params);
      const videoId = _params.get("v");
      if (!videoId) return;
      _params.delete("v");
      _params.append("autoplay", "0");
      _params.append("list", listId);
      return {
        videoId,
        params: _params,
      };
    }
  }
  return undefined;
};
