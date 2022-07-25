import { statusBar } from "./dom.ts";

export interface UseStatusBarResult {
  /** 取得した.status-barの領域に情報を表示する */
  render: (...items: Item[]) => void;
  /** 取得した.statusb-barの領域を削除する */
  dispose: () => void;
}

/** .status-barの一区画を取得し、各種操作函数を返す */
export const useStatusBar = (): UseStatusBarResult => {
  const bar = statusBar();
  if (!bar) throw new Error(`div.status-bar can't be found`);

  const status = document.createElement("div");
  bar.append(status);

  return {
    render: (...items: Item[]) => {
      status.textContent = "";
      const child = makeGroup(...items);
      if (child) status.append(child);
    },
    dispose: () => status.remove(),
  };
};

export interface ItemGroup {
  type: "group";
  items: Item[];
}
export type Item =
  | {
    type: "spinner" | "check-circle" | "exclamation-triangle";
  }
  | { type: "text"; text: string }
  | ItemGroup;

const makeGroup = (...items: Item[]): HTMLSpanElement | undefined => {
  const nodes = items.flatMap((item) => {
    switch (item.type) {
      case "spinner":
        return [makeSpinner()];
      case "check-circle":
        return [makeCheckCircle()];
      case "exclamation-triangle":
        return [makeExclamationTriangle()];
      case "text":
        return [makeItem(item.text)];
      case "group": {
        const group = makeGroup(...item.items);
        return group ? [group] : [];
      }
    }
  });
  if (nodes.length === 0) return;
  if (nodes.length === 1) return nodes[0];
  const span = document.createElement("span");
  span.classList.add("item-group");
  span.append(...nodes);
  return span;
};
const makeItem = (child: string | Node) => {
  const span = document.createElement("span");
  span.classList.add("item");
  span.append(child);
  return span;
};

/** スピナーを作る */
const makeSpinner = () => {
  const i = document.createElement("i");
  i.classList.add("fa", "fa-spinner");
  return makeItem(i);
};

/** チェックマークを作る */
const makeCheckCircle = () => {
  const i = document.createElement("i");
  i.classList.add("kamon", "kamon-check-circle");
  return makeItem(i);
};

/** 警告アイコンを作る */
const makeExclamationTriangle = () => {
  const i = document.createElement("i");
  i.classList.add("fas", "fa-exclamation-triangle");
  return makeItem(i);
};
