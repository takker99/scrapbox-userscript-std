// These code are based on https://deno.land/x/unknownutil@v1.1.0/ensure.ts

export const ensureHTMLDivElement: (
  value: unknown,
  name: string,
) => asserts value is HTMLDivElement = (
  value,
  name,
) => {
  if (value instanceof HTMLDivElement) return;
  throw new TypeError(
    `"${name}" must be HTMLDivElememt but actual is "${value}"`,
  );
};

export const ensureHTMLAnchorElement: (
  value: unknown,
  name: string,
) => asserts value is HTMLAnchorElement = (
  value,
  name,
) => {
  if (value instanceof HTMLAnchorElement) return;
  throw new TypeError(
    `"${name}" must be HTMLAnchorElememt but actual is "${value}"`,
  );
};

export const ensureHTMLTextAreaElement: (
  value: unknown,
  name: string,
) => asserts value is HTMLTextAreaElement = (
  value,
  name,
) => {
  if (value instanceof HTMLTextAreaElement) return;
  throw new TypeError(
    `"${name}" must be HTMLTextAreaElement but actual is "${value}"`,
  );
};
