export const isSameArray = <T>(a: T[], b: T[]): boolean =>
  a.length === b.length && a.every((x) => b.includes(x));
