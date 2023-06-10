import { Bytes } from "@graphprotocol/graph-ts";

// A function which given 3 arrays of arbitrary types of the same length,
// where the first one holds the reference order, the second one holds the same elements
// as the first but in different order, and the third any arbitrary elements. It will return
// the third array after sorting it according to the order of the first one.
// For example:
// sortArrayByReference(['a', 'c', 'b'], ['a', 'b', 'c'], [1, 2, 3]) => [1, 3, 2]
export function sortArrayByReference<T, K>(
  reference: T[],
  array: T[],
  toSort: K[]
): K[] {
  const sorted: K[] = new Array<K>();
  for (let i = 0; i < reference.length; i++) {
    const index = array.indexOf(reference[i]);
    sorted.push(toSort[index]);
  }
  return sorted;
}

// sortBytesArray will sort an array of Bytes in ascending order
// by comparing their hex string representation.
export function sortBytesArray(array: Bytes[]): Bytes[] {
  const toSort = array.map<string>((item) => item.toHexString());
  toSort.sort();
  return toSort.map<Bytes>((item) => Bytes.fromHexString(item));
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

export function addArrays<T>(a: T[], b: T[]): T[] {
  const retval = new Array<T>();
  if (a.length == b.length) {
    let i = 0;
    while (i < a.length) {
      retval.push(a[i].plus(b[i]));
      i += 1;
    }
  }
  return retval;
}

export function subtractArrays<T>(a: T[], b: T[]): T[] {
  const retval = new Array<T>();
  if (a.length == b.length) {
    let i = 0;
    while (i < a.length) {
      retval.push(a[i].minus(b[i]));
      i += 1;
    }
  }
  return retval;
}
