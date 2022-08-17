import { Bytes, Address, BigInt } from "@graphprotocol/graph-ts";

export function extractCallData(bytes: Bytes, start: i32, end: i32): Bytes {
  return Bytes.fromUint8Array(bytes.subarray(start, end));
}

export function bytes32ToAddress(bytes: Bytes): Address {
  //take the last 40 hexstring & convert it to address (20 bytes)
  let address = bytes32ToAddressHexString(bytes);
  return Address.fromString(address);
}

export function bytes32ToAddressHexString(bytes: Bytes): string {
  //take the last 40 hexstring
  return bytes.toHexString().slice(26);
}

export function bytesToUnsignedBigInt(bytes: Bytes, bigEndian: boolean = true): BigInt {
  // Caution: this function changes the input bytes for bigEndian
  return BigInt.fromUnsignedBytes(bigEndian ? Bytes.fromUint8Array(bytes.reverse()) : bytes);
}

export function bytesToSignedBigInt(bytes: Bytes, bigEndian: boolean = true): BigInt {
  // Caution: this function changes the input bytes for bigEndian
  return BigInt.fromSignedBytes(bigEndian ? Bytes.fromUint8Array(bytes.reverse()) : bytes);
}
