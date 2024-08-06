import { diff, toExtendedChanges } from "../../deps/onp.ts";
import type { Line } from "@cosense/types/userscript";
import type {
  DeleteChange,
  InsertChange,
  UpdateChange,
} from "./websocket-types.ts";
import { createNewLineId } from "./id.ts";

type Options = {
  userId: string;
};
export function* diffToChanges(
  left: Pick<Line, "text" | "id">[],
  right: string[],
  { userId }: Options,
): Generator<DeleteChange | InsertChange | UpdateChange, void, unknown> {
  const { buildSES } = diff(
    left.map(({ text }) => text),
    right,
  );
  let lineNo = 0;
  let lineId = left[0].id;
  for (const change of toExtendedChanges(buildSES())) {
    switch (change.type) {
      case "added":
        yield {
          _insert: lineId,
          lines: {
            id: createNewLineId(userId),
            text: change.value,
          },
        };
        continue;
      case "deleted":
        yield {
          _delete: lineId,
          lines: -1,
        };
        break;
      case "replaced":
        yield {
          _update: lineId,
          lines: { text: change.value },
        };
        break;
    }
    lineNo++;
    lineId = left[lineNo]?.id ?? "_end";
  }
}
