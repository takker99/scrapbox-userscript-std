// ported from https://github.com/takker99/ScrapBubble/blob/0.4.0/Page.tsx#L662

const youtubeRegExp = /https?:\/\/(?:www\.|music\.|)youtube\.com\/watch/;
const youtubeDotBeRegExp =
  /https?:\/\/youtu\.be\/([a-zA-Z\d_-]+)(?:\?([^\s]{0,100})|)/;
const youtubeShortRegExp =
  /https?:\/\/(?:www\.|)youtube\.com\/shorts\/([a-zA-Z\d_-]+)(?:\?([^\s]+)|)/;
const youtubeListRegExp =
  /https?:\/\/(?:www\.|music\.|)youtube\.com\/playlist\?((?:[^\s]+&|)list=([a-zA-Z\d_-]+)(?:&[^\s]+|))/;

export type YoutubeProps = {
  params: URLSearchParams;
  videoId: string;
  pathType: "com" | "dotbe" | "short";
} | {
  params: URLSearchParams;
  listId: string;
  pathType: "list";
};

/** YoutubeのURLを解析してVideo IDなどを取り出す
 *
 * @param url YoutubeのURL
 * @return 解析結果 YoutubeのURLでなかったときは`undefined`を返す
 */
export const parseYoutube = (url: string): YoutubeProps | undefined => {
  if (youtubeRegExp.test(url)) {
    const params = new URL(url).searchParams;
    const videoId = params.get("v");
    if (videoId) {
      return {
        pathType: "com",
        videoId,
        params,
      };
    }
  }

  {
    const matches = url.match(youtubeDotBeRegExp);
    if (matches) {
      const [, videoId, params] = matches;
      return {
        videoId,
        params: new URLSearchParams(params),
        pathType: "dotbe",
      };
    }
  }

  {
    const matches = url.match(youtubeShortRegExp);
    if (matches) {
      const [, videoId, params] = matches;
      return {
        videoId,
        params: new URLSearchParams(params),
        pathType: "short",
      };
    }
  }

  {
    const matches = url.match(youtubeListRegExp);
    if (matches) {
      const [, params, listId] = matches;

      return { listId, params: new URLSearchParams(params), pathType: "list" };
    }
  }

  return undefined;
};
