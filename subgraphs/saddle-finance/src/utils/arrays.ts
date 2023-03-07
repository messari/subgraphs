export function arrayDiff<T>(a: T[], b: T[]): T[] {
  let diff: T[] = new Array<T>();
  for (let i: i32 = 0; i < a.length; i++) {
    if (b.indexOf(a[i]) == -1) {
      diff = diff.concat([a[i]]);
    }
  }
  return diff;
}

export function arrayUnique<T>(array: T[]): T[] {
  let unique: T[] = new Array<T>();
  for (let i: i32 = 0; i < array.length; i++) {
    if (array.indexOf(array[i]) == i) {
      unique = unique.concat([array[i]]);
    }
  }
  return unique;
}

export function arrayUniqueBy<T>(array: T[], pluck: (item: T) => string): T[] {
  const references = array.map<string>((item) => pluck(item));
  let unique: T[] = new Array<T>();
  for (let i: i32 = 0; i < references.length; i++) {
    if (references.indexOf(references[i]) == i) {
      unique = unique.concat([array[i]]);
    }
  }
  return unique;
}
