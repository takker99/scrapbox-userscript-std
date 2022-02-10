export const ensureArray: <T>(
  value: unknown,
  name: string,
) => asserts value is T[] = (value, name) => {
  if (Array.isArray(value)) return;
  throw new TypeError(`"${name}" must be an array but actual is "${value}"`);
};
