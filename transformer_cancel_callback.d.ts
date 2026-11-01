// deno-lint-ignore-file no-explicit-any
// Workaround for https://github.com/denoland/deno/issues/35542
// Deno <=2.9.x's bundled `node/stream/web.d.cts` references
// `globalThis.TransformerCancelCallback`, which no bundled lib defines
// (`lib.dom.d.ts` and `"deno.ns"` lack it; canary only masks the error via the
// new `skipLibCheck: true` default, denoland/deno#35938). The type itself stays
// missing until denoland/deno#36094 reconciles node web streams.
// This mirrors the inline interface that stock @types/node (and the suggested
// upstream fix) use, so it merges cleanly once Deno defines it.
// Delete this file once Deno ships a real definition.
interface TransformerCancelCallback {
  (reason: any): void | PromiseLike<void>;
}
