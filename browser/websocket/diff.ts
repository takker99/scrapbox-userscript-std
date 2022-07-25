/**
 * The algorithm implemented here is based on "An O(NP) Sequence Comparison Algorithm"
 * by described by Sun Wu, Udi Manber and Gene Myers */

/** LICENSE: https://github.com/cubicdaiya/onp/blob/master/COPYING */

type Position = {
  x: number;
  y: number;
};

export interface Added<T> {
  value: T;
  type: "added";
}
export interface Deleted<T> {
  value: T;
  type: "deleted";
}
export interface Common<T> {
  value: T;
  type: "common";
}
export type Change<T> = Added<T> | Deleted<T> | Common<T>;
export interface Replaced<T> {
  value: T;
  oldValue: T;
  type: "replaced";
}
export type ExtendedChange<T> = Change<T> | Replaced<T>;

export interface DiffResult<T> {
  from: ArrayLike<T>;
  to: ArrayLike<T>;
  editDistance: number;
  buildSES(): Generator<Change<T>, void, unknown>;
}

export const diff = <T>(
  left: ArrayLike<T>,
  right: ArrayLike<T>,
): DiffResult<T> => {
  const reversed = left.length > right.length;
  const a = reversed ? right : left;
  const b = reversed ? left : right;

  const offset = a.length + 1;
  const MAXSIZE = a.length + b.length + 3;
  const path = new Array<number>(MAXSIZE);
  path.fill(-1);
  const pathpos = [] as [Position, number][];

  function snake(k: number, p: number, pp: number) {
    let y = Math.max(p, pp);
    let x = y - k;

    while (x < a.length && y < b.length && a[x] === b[y]) {
      ++x;
      ++y;
    }

    path[k + offset] = pathpos.length;
    pathpos.push([{ x, y }, path[k + (p > pp ? -1 : +1) + offset]]);
    return y;
  }

  const fp = new Array<number>(MAXSIZE);
  fp.fill(-1);
  let p = -1;
  const delta = b.length - a.length;
  do {
    ++p;
    for (let k = -p; k <= delta - 1; ++k) {
      fp[k + offset] = snake(k, fp[k - 1 + offset] + 1, fp[k + 1 + offset]);
    }
    for (let k = delta + p; k >= delta + 1; --k) {
      fp[k + offset] = snake(k, fp[k - 1 + offset] + 1, fp[k + 1 + offset]);
    }
    fp[delta + offset] = snake(
      delta,
      fp[delta - 1 + offset] + 1,
      fp[delta + 1 + offset],
    );
  } while (fp[delta + offset] !== b.length);

  const epc = [] as Position[];
  let r = path[delta + offset];
  while (r !== -1) {
    epc.push(pathpos[r][0]);
    r = pathpos[r][1];
  }

  return {
    from: left,
    to: right,
    editDistance: delta + p * 2,
    buildSES: function* () {
      let xIndex = 0;
      let yIndex = 0;
      for (const { x, y } of reverse(epc)) {
        while (xIndex < x || yIndex < y) {
          if (y - x > yIndex - xIndex) {
            yield { value: b[yIndex], type: reversed ? "deleted" : "added" };
            ++yIndex;
          } else if (y - x < yIndex - xIndex) {
            yield { value: a[xIndex], type: reversed ? "added" : "deleted" };
            ++xIndex;
          } else {
            yield { value: a[xIndex], type: "common" };
            ++xIndex;
            ++yIndex;
          }
        }
      }
    },
  };
};

export function* toExtendedChanges<T>(
  changes: Iterable<Change<T>>,
): Generator<ExtendedChange<T>, void, unknown> {
  let addedList = [] as Added<T>[];
  let deletedList = [] as Deleted<T>[];

  function* flush() {
    if (addedList.length > deletedList.length) {
      for (let i = 0; i < deletedList.length; i++) {
        yield makeReplaced(
          addedList[i],
          deletedList[i],
        );
      }
      for (let i = deletedList.length; i < addedList.length; i++) {
        yield addedList[i];
      }
    } else {
      for (let i = 0; i < addedList.length; i++) {
        yield makeReplaced(
          addedList[i],
          deletedList[i],
        );
      }
      for (let i = addedList.length; i < deletedList.length; i++) {
        yield deletedList[i];
      }
    }
    addedList = [];
    deletedList = [];
  }

  for (const change of changes) {
    switch (change.type) {
      case "added":
        addedList.push(change);
        break;
      case "deleted":
        deletedList.push(change);
        break;
      case "common":
        yield* flush();
        yield change;
        break;
    }
  }
  yield* flush();
}

const makeReplaced = <T>(
  left: Added<T>,
  right: Deleted<T>,
): Replaced<T> => ({
  value: left.value,
  oldValue: right.value,
  type: "replaced",
});

function* reverse<T>(list: ArrayLike<T>) {
  for (let i = list.length - 1; i >= 0; i--) {
    yield list[i];
  }
}
