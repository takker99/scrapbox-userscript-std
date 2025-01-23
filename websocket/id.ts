const zero = (n: string) => n.padStart(8, "0");

export const createNewLineId = (userId: string): string => {
  const time = Math.floor(new Date().getTime() / 1000).toString(16);
  const rand = Math.floor(0xFFFFFE * Math.random()).toString(16);
  return `${zero(time).slice(-8)}${userId.slice(-6)}0000${zero(rand)}`;
};
export const getUnixTimeFromId = (id: string): number => {
  if (!isId(id)) throw SyntaxError(`"${id}" is an invalid id.`);

  return parseInt(`0x${id.slice(0, 8)}`, 16);
};
export const isId = (id: string): boolean => /^[a-f\d]{24,32}$/.test(id);
