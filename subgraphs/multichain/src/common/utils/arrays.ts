export function removeFromArrayAtIndex<T>(x: T[], index: i32): T[] {
  const retval = new Array<T>(x.length - 1);
  let nI = 0;
  for (let i = 0; i < x.length; i++) {
    if (i != index) {
      retval[nI] = x[i];
      nI += 1;
    }
  }
  return retval;
}

export function addToArrayAtIndex<T>(x: T[], item: T, index: i32 = -1): T[] {
  if (x.length == 0) {
    return [item];
  }
  if (index == -1 || index > x.length) {
    index = x.length;
  }
  const retval = new Array<T>();
  let i = 0;
  while (i < index) {
    retval.push(x[i]);
    i += 1;
  }
  retval.push(item);
  while (i < x.length) {
    retval.push(x[i]);
    i += 1;
  }
  return retval;
}

export function updateArrayAtIndex<T>(x: T[], item: T, index: i32): T[] {
  if (x.length == 0) {
    return [item];
  }
  if (index == -1 || index > x.length) {
    index = x.length;
  }
  const retval = new Array<T>();
  let i = 0;
  while (i < index) {
    retval.push(x[i]);
    i += 1;
  }
  retval.push(item);
  i += 1;
  while (i < x.length) {
    retval.push(x[i]);
    i += 1;
  }
  return retval;
}

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
