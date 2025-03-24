import type { JsonValue } from "@std/json/types";
import type { IsAny } from "@std/testing/types";
export type { IsAny, JsonValue };

/**
 * Check if a property {@linkcode K} is optional in {@linkcode T}.
 *
 * ```ts
 * import type { Assert } from "@std/testing/types";
 *
 * type _1 = Assert<IsOptional<{ a?: number }, "a">, true>;
 * type _2 = Assert<IsOptional<{ a?: undefined }, "a">, true>;
 * type _3 = Assert<IsOptional<{ a?: number | undefined }, "a">, true>;
 * type _4 = Assert<IsOptional<{ a: number }, "a">, false>;
 * type _5 = Assert<IsOptional<{ a: undefined }, "a">, false>;
 * type _6 = Assert<IsOptional<{ a: number | undefined }, "a">, false>;
 * ```
 * @internal
 *
 * @see https://dev.to/zirkelc/typescript-how-to-check-for-optional-properties-3192
 */
export type IsOptional<T, K extends keyof T> =
  Record<PropertyKey, never> extends Pick<T, K> ? true : false;

/**
 * A type that is compatible with JSON.
 *
 * ```ts
 * import type { JsonValue } from "@std/json/types";
 * import { assertType } from "@std/testing/types";
 *
 * type IsJsonCompatible<T> = [T] extends [JsonCompatible<T>] ? true : false;
 *
 * assertType<IsJsonCompatible<null>>(true);
 * assertType<IsJsonCompatible<false>>(true);
 * assertType<IsJsonCompatible<0>>(true);
 * assertType<IsJsonCompatible<"">>(true);
 * assertType<IsJsonCompatible<[]>>(true);
 * assertType<IsJsonCompatible<JsonValue>>(true);
 * assertType<IsJsonCompatible<symbol>>(false);
 * // deno-lint-ignore no-explicit-any
 * assertType<IsJsonCompatible<any>>(false);
 * assertType<IsJsonCompatible<unknown>>(false);
 * assertType<IsJsonCompatible<undefined>>(false);
 * // deno-lint-ignore ban-types
 * assertType<IsJsonCompatible<Function>>(false);
 * assertType<IsJsonCompatible<() => void>>(false);
 * assertType<IsJsonCompatible<number | undefined>>(false);
 * assertType<IsJsonCompatible<symbol | undefined>>(false);
 *
 * assertType<IsJsonCompatible<object>>(true);
 * // deno-lint-ignore ban-types
 * assertType<IsJsonCompatible<{}>>(true);
 * assertType<IsJsonCompatible<{ a: 0 }>>(true);
 * assertType<IsJsonCompatible<{ a: "" }>>(true);
 * assertType<IsJsonCompatible<{ a: [] }>>(true);
 * assertType<IsJsonCompatible<{ a: null }>>(true);
 * assertType<IsJsonCompatible<{ a: false }>>(true);
 * assertType<IsJsonCompatible<{ a: boolean }>>(true);
 * assertType<IsJsonCompatible<{ a: Date }>>(false);
 * assertType<IsJsonCompatible<{ a?: Date }>>(false);
 * assertType<IsJsonCompatible<{ a: number }>>(true);
 * assertType<IsJsonCompatible<{ a?: number }>>(true);
 * assertType<IsJsonCompatible<{ a: undefined }>>(false);
 * assertType<IsJsonCompatible<{ a?: undefined }>>(true);
 * assertType<IsJsonCompatible<{ a: number | undefined }>>(false);
 * assertType<IsJsonCompatible<{ a: null }>>(true);
 * assertType<IsJsonCompatible<{ a: null | undefined }>>(false);
 * assertType<IsJsonCompatible<{ a?: null }>>(true);
 * assertType<IsJsonCompatible<{ a: JsonValue }>>(true);
 * // deno-lint-ignore no-explicit-any
 * assertType<IsJsonCompatible<{ a: any }>>(false);
 * assertType<IsJsonCompatible<{ a: unknown }>>(false);
 * // deno-lint-ignore ban-types
 * assertType<IsJsonCompatible<{ a: Function }>>(false);
 * // deno-lint-ignore no-explicit-any
 * assertType<IsJsonCompatible<{ a: () => any }>>(false);
 * // deno-lint-ignore no-explicit-any
 * assertType<IsJsonCompatible<{ a: (() => any) | number }>>(false);
 * // deno-lint-ignore no-explicit-any
 * assertType<IsJsonCompatible<{ a?: () => any }>>(false);
 * class A {
 *   a = 34;
 * }
 * assertType<IsJsonCompatible<A>>(true);
 * class B {
 *   fn() {
 *     return "hello";
 *   };
 * }
 * assertType<IsJsonCompatible<B>>(false);
 *
 * assertType<IsJsonCompatible<{ a: number } | { a: string }>>(true);
 * assertType<IsJsonCompatible<{ a: number } | { a: () => void }>>(false);
 *
 * assertType<IsJsonCompatible<{ a: { aa: string } }>>(true);
 * interface D {
 *   aa: string;
 * }
 * assertType<IsJsonCompatible<D>>(true);
 * interface E {
 *   a: D;
 * }
 * assertType<IsJsonCompatible<E>>(true);
 * interface F {
 *   _: E;
 * }
 * assertType<IsJsonCompatible<F>>(true);
 * ```
 *
 * @see This implementation is heavily inspired by https://github.com/microsoft/TypeScript/issues/1897#issuecomment-580962081 .
 */
export type JsonCompatible<T> =
  // deno-lint-ignore ban-types
  [Extract<T, Function | symbol | undefined>] extends [never] ? {
      [K in keyof T]: [IsAny<T[K]>] extends [true] ? never
        : T[K] extends JsonValue ? T[K]
        : [IsOptional<T, K>] extends [true]
          ? JsonCompatible<Exclude<T[K], undefined>> | Extract<T[K], undefined>
        : undefined extends T[K] ? never
        : JsonCompatible<T[K]>;
    }
    : never;
