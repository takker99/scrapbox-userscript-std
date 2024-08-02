export const isHeightViewable = (element: HTMLElement): boolean => {
  const { top, bottom } = element.getBoundingClientRect();
  return top >= 0 && bottom <= globalThis.innerHeight;
};
