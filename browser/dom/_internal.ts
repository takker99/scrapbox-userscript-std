/** 
 * Encodes `AddEventListenerOptions` into a number for equality comparison.
 * This function converts the options object into a single number where each bit
 * represents a specific option (capture, once, passive).
 */
export const encode = (
  options: AddEventListenerOptions | boolean | undefined,
): number => {
  if (options === undefined) return 0;
  if (typeof options === "boolean") return Number(options);
  // Encode each flag into its corresponding bit position
  return (
    (options.capture ? 1 : 0) |
    (options.once ? 2 : 0) |
    (options.passive ? 4 : 0)
  );
};
/** 
 * Decodes a number back into `AddEventListenerOptions` object.
 * Each bit in the encoded number represents a specific option:
 *
 * - `capture`: `0b001` (bit 0)
 * - `once`: `0b010` (bit 1)
 * - `passive`: `0b100` (bit 2)
 * - `0`: returns `undefined`
 *
 * @param encoded The number containing encoded `AddEventListenerOptions` flags
 * @returns An `AddEventListenerOptions` object or `undefined` if encoded value is 0
 */
export const decode = (
  encoded: number,
): AddEventListenerOptions | undefined => {
  if (encoded === 0) return;
  const options: AddEventListenerOptions = {};
  if (encoded & 1) options.capture = true;
  if (encoded & 2) options.once = true;
  if (encoded & 4) options.passive = true;

  return options;
};
