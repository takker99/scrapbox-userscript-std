import type { Scrapbox } from "@cosense/types/userscript";
import { textInput } from "./dom.ts";
import { decode, encode } from "./_internal.ts";
declare const scrapbox: Scrapbox;

/** - first key: event name
 * - second key: listener
 * - value: encoded options
 */
const listenerMap = /* @__PURE__ */ new Map<
  keyof HTMLElementEventMap,
  Map<EventListener, Set<number>>
>();
const onceListenerMap = /* @__PURE__ */ new Map<
  EventListener,
  Map<number, EventListener>
>();

/** re-register event listeners when the layout changes */
let reRegister: (() => void) | undefined = () => {
  scrapbox.on("layout:changed", () => {
    const textinput = textInput();
    if (!textinput) return;
    for (const [name, argMap] of listenerMap) {
      for (const [listener, encodedOptions] of argMap) {
        for (const encoded of encodedOptions) {
          textinput.addEventListener(
            name,
            listener as EventListener,
            decode(encoded),
          );
        }
      }
    }
  });
  reRegister = undefined;
};

/** `#text-input`に対してイベントリスナーを追加する
 *
 * `#text-input`はページレイアウトが変わると削除されるため、登録したイベントリスナーの記憶と再登録をこの関数で行っている
 *
 * @param name event name
 * @param listener event listener
 * @param options event listener options
 * @returns
 */
export const addTextInputEventListener = <K extends keyof HTMLElementEventMap>(
  name: K,
  listener: (
    this: HTMLTextAreaElement,
    event: HTMLElementEventMap[K],
  ) => unknown,
  options?: boolean | AddEventListenerOptions,
): void => {
  reRegister?.();
  const argMap = listenerMap.get(name) ?? new Map<EventListener, Set<number>>();
  const encodedOptions = argMap.get(listener as EventListener) ?? new Set();
  if (encodedOptions.has(encode(options))) return;
  encodedOptions.add(encode(options));
  argMap.set(listener as EventListener, encodedOptions);
  listenerMap.set(name, argMap);
  if (typeof options === "object" && options?.once) {
    const onceMap = onceListenerMap.get(listener as EventListener) ??
      new Map<number, EventListener>();
    const encoded = encode(options);

    /** 呼び出し時に、`listenerMap`からの登録も解除するwrapper listener */
    const onceListener = function (
      this: HTMLTextAreaElement,
      event: HTMLElementEventMap[K],
    ) {
      removeTextInputEventListener(name, listener, options);
      onceMap.delete(encoded);
      return listener.call(this, event);
    };
    onceMap.set(encoded, onceListener as EventListener);
    onceListenerMap.set(listener as EventListener, onceMap);

    const textinput = textInput();
    if (!textinput) return;
    textinput.addEventListener<K>(name, onceListener, options);
  }
  const textinput = textInput();
  if (!textinput) return;
  textinput.addEventListener<K>(name, listener, options);
};

export const removeTextInputEventListener = <
  K extends keyof HTMLElementEventMap,
>(
  name: K,
  listener: (event: HTMLElementEventMap[K]) => unknown,
  options?: boolean | AddEventListenerOptions,
): void => {
  reRegister?.();
  const argMap = listenerMap.get(name);
  if (!argMap) return;
  const encodedOptions = argMap.get(listener as EventListener);
  if (!encodedOptions) return;
  const encoded = encode(options);
  encodedOptions.delete(encoded);
  if (typeof options === "object" && options?.once) {
    const onceMap = onceListenerMap.get(listener as EventListener);
    if (!onceMap) return;
    const onceListener = onceMap.get(encoded);
    if (!onceListener) return;

    const textinput = textInput();
    if (!textinput) return;
    textinput.removeEventListener(name, onceListener, options);
    onceMap.delete(encoded);
    return;
  }
  const textinput = textInput();
  if (!textinput) return;
  textinput.removeEventListener(name, listener, options);
};
