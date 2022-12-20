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
