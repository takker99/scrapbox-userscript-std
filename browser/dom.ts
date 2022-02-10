/// <reference no-default-lib="true"/>
/// <reference lib="esnext"/>
/// <reference lib="dom" />
import {
  ensureHTMLAnchorElement,
  ensureHTMLDivElement,
  ensureHTMLTextAreaElement,
} from "./ensure.ts";

export const editor = (): HTMLDivElement | undefined =>
  checkDiv(document.getElementById("editor"), "div#editor");
export const lines = (): HTMLDivElement | undefined =>
  checkDiv(
    document.getElementsByClassName("lines").item(0),
    "div.lines",
  );
export const computeLine = (): HTMLDivElement | undefined =>
  checkDiv(document.getElementById("compute-line"), "div#compute-line");
export const cursorLine = (): HTMLDivElement | undefined =>
  checkDiv(
    document.getElementsByClassName("cursor-line").item(0),
    "div.cursor-line",
  );
export const textInput = (): HTMLTextAreaElement | undefined => {
  const textarea = document.getElementById("text-input");
  if (!textarea) return;
  ensureHTMLTextAreaElement(textarea, "textarea#text-input");
  return textarea;
};
export const cursor = (): HTMLDivElement | undefined =>
  checkDiv(
    document.getElementsByClassName("cursor").item(0),
    "div.cursor",
  );
export const selections = (): HTMLDivElement | undefined =>
  checkDiv(
    document.getElementsByClassName("selections")?.[0],
    "div.selections",
  );
export const grid = (): HTMLDivElement | undefined =>
  checkDiv(
    document.getElementsByClassName("related-page-list clearfix")[0]
      ?.getElementsByClassName?.("grid")?.item(0),
    ".related-page-list.clearfix div.grid",
  );
export const popupMenu = (): HTMLDivElement | undefined =>
  checkDiv(
    document.getElementsByClassName("popup-menu")?.[0],
    "div.popup-menu",
  );
export const pageMenu = (): HTMLDivElement | undefined =>
  checkDiv(
    document.getElementsByClassName("page-menu")?.[0],
    "div.page-menu",
  );
export const pageInfoMenu = (): HTMLAnchorElement | undefined =>
  checkAnchor(
    document.getElementById("page-info-menu"),
    "a#page-info-menu",
  );
export const pageEditMenu = (): HTMLAnchorElement | undefined =>
  checkAnchor(
    document.getElementById("page-edit-menu"),
    "a#page-edit-menu",
  );
export const pageEditButtons = (): HTMLAnchorElement[] =>
  Array.from(
    pageEditMenu()?.nextElementSibling?.getElementsByTagName?.("a") ?? [],
  );
export const randomJumpButton = (): HTMLAnchorElement | undefined =>
  checkAnchor(
    document.getElementsByClassName("random-jump-button").item(0),
    "a#random-jump-button",
  );
export const pageCustomButtons = (): HTMLAnchorElement[] =>
  Array.from(document.getElementsByClassName("page-menu-extension")).flatMap(
    (div) => {
      const a = div.getElementsByTagName("a").item(0);
      return a ? [a] : [];
    },
  );
export const statusBar = (): HTMLDivElement | undefined =>
  checkDiv(
    document.getElementsByClassName("status-bar")?.[0],
    "div.status-bar",
  );

const checkDiv = (div: Element | null, name: string) => {
  if (!div) return;
  ensureHTMLDivElement(div, name);
  return div;
};

const checkAnchor = (a: Element | null, name: string) => {
  if (!a) return;
  ensureHTMLAnchorElement(a, name);
  return a;
};
