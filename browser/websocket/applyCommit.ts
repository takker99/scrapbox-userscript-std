import type { CommitNotification } from "../../deps/socket.ts";
import type { Page } from "@cosense/types/rest";
import { getUnixTimeFromId } from "./id.ts";
type Line = Page["lines"][number];

export interface ApplyCommitProp {
  /** changesの作成日時
   *
   * UnixTimeか、UnixTimeを含んだidを渡す。
   * 何も指定されなかったら、実行時の時刻を用いる
   */
  updated?: number | string;
  /** user id */ userId: string;
}

/** メタデータを含んだ行にcommitsを適用する
 *
 * @param lines commitsを適用する行
 * @param changes 適用するcommits
 */
export const applyCommit = (
  lines: readonly Line[],
  changes: CommitNotification["changes"],
  { updated, userId }: ApplyCommitProp,
): Line[] => {
  const newLines = [...lines];
  const getPos = (lineId: string) => {
    const position = newLines.findIndex(({ id }) => id === lineId);
    if (position < 0) {
      throw RangeError(`No line whose id is ${lineId} found.`);
    }
    return position;
  };

  for (const change of changes) {
    if ("_insert" in change) {
      const created = getUnixTimeFromId(change.lines.id);
      const newLine = {
        text: change.lines.text,
        id: change.lines.id,
        userId,
        updated: created,
        created,
      };
      if (change._insert === "_end") {
        newLines.push(newLine);
      } else {
        newLines.splice(getPos(change._insert), 0, newLine);
      }
    } else if ("_update" in change) {
      const position = getPos(change._update);
      newLines[position].text = change.lines.text;
      newLines[position].updated = typeof updated === "string"
        ? getUnixTimeFromId(updated)
        : updated ?? Math.round(new Date().getTime() / 1000);
    } else if ("_delete" in change) {
      newLines.splice(getPos(change._delete), 1);
    }
  }
  return newLines;
};
