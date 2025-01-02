import type { CommitNotification } from "./listen-events.ts";
import type { BaseLine } from "@cosense/types/rest";
import { getUnixTimeFromId } from "./id.ts";

export interface ApplyCommitProp {
  /** Timestamp for when the changes were created
   *
   * Can be provided as either:
   * - A Unix timestamp (number)
   * - An ID containing a Unix timestamp (string)
   * If not specified, the current time will be used
   */
  updated?: number | string;
  /** The ID of the user making the changes
   *
   * This ID is used to:
   * - Track who made each line modification
   * - Associate changes with user accounts
   * - Maintain edit history and attribution
   */ 
  userId: string;
}

/** Apply commits to lines with metadata
 *
 * This function processes a series of commits (changes) to modify lines in a Scrapbox page.
 * Each commit can be one of:
 * - Insert: Add a new line at a specific position or at the end
 * - Update: Modify the text of an existing line
 * - Delete: Remove a line
 *
 * @param lines - The lines to apply commits to, each containing metadata (id, text, etc.)
 * @param changes - The commits to apply, each specifying an operation and target line
 * @param options - Configuration including userId and optional timestamp
 */
export const applyCommit = (
  lines: readonly BaseLine[],
  changes: CommitNotification["changes"],
  { updated, userId }: ApplyCommitProp,
): BaseLine[] => {
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
