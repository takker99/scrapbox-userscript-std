export const suggestUnDupTitle = (title: string): string => {
  const matched = title.match(/(.+?)(?:_(\d+))?$/);
  const title_ = matched?.[1] ?? title;
  const num = matched?.[2] ? parseInt(matched[2]) + 1 : 2;
  return `${title_}_${num}`;
};
