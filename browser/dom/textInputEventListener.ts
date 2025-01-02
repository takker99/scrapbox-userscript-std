import type { Scrapbox } from "@cosense/types/userscript";
import { textInput } from "./dom.ts";
import { decode, encode } from "./_internal.ts";
declare const scrapbox: Scrapbox;

/** Map structure for tracking event listeners and their options
 * 
 * Structure:
 * - First level: Maps event names to their listeners
 * - Second level: Maps each listener to its set of encoded options
 * - The encoded options allow tracking multiple registrations of the same
 *   listener with different options
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

/** Add an event listener to the `#text-input` element with automatic re-registration
 *
 * In Scrapbox, the `#text-input` element is recreated when the page layout changes.
 * This function manages event listeners by:
 * 1. Storing the listener and its options in a persistent map
 * 2. Automatically re-registering all listeners when layout changes
 * 3. Handling both regular and once-only event listeners
 *
 * @param name - The event type to listen for (e.g., 'input', 'keydown')
 * @param listener - The callback function to execute when the event occurs
 * @param options - Standard addEventListener options or boolean for useCapture
 * @returns void
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

    /** A wrapper listener that removes itself from the `listenerMap` when called
     * 
     * This wrapper ensures proper cleanup of both the DOM event listener and our
     * internal listener tracking when a 'once' listener is triggered.
     */
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
