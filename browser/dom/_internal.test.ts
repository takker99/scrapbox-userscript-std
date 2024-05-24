import { assertEquals } from "../../deps/testing.ts";
import { decode, encode } from "./_internal.ts";

Deno.test("encode()", async (t) => {
  await t.step("should return 0 when options is undefined", () => {
    const result = encode(undefined);
    assertEquals(result, 0);
  });

  await t.step("should return 1 when options.capture is true", () => {
    const options = { capture: true };
    const result = encode(options);
    assertEquals(result, 1);
  });

  await t.step("should return 2 when options.once is true", () => {
    const options = { once: true };
    const result = encode(options);
    assertEquals(result, 2);
  });

  await t.step("should return 4 when options.passive is true", () => {
    const options = { passive: true };
    const result = encode(options);
    assertEquals(result, 4);
  });

  await t.step("should return 7 when all options are true", () => {
    const options = { capture: true, once: true, passive: true };
    const result = encode(options);
    assertEquals(result, 7);
  });

  await t.step("should return 0 when options is false", () => {
    const result = encode(false);
    assertEquals(result, 0);
  });

  await t.step("should return 1 when options is true", () => {
    const result = encode(true);
    assertEquals(result, 1);
  });
});
Deno.test("decode()", async (t) => {
  await t.step("should return undefined when encoded is 0", () => {
    const result = decode(0);
    assertEquals(result, undefined);
  });

  await t.step("should return options with capture when encoded is 1", () => {
    const encoded = 1;
    const result = decode(encoded);
    assertEquals(result, { capture: true });
  });

  await t.step("should return options with once when encoded is 2", () => {
    const encoded = 2;
    const result = decode(encoded);
    assertEquals(result, { once: true });
  });

  await t.step("should return options with passive when encoded is 4", () => {
    const encoded = 4;
    const result = decode(encoded);
    assertEquals(result, { passive: true });
  });

  await t.step("should return options with all flags when encoded is 7", () => {
    const encoded = 7;
    const result = decode(encoded);
    assertEquals(result, { capture: true, once: true, passive: true });
  });
});
