import {
  Address,
  BigInt,
  Bytes,
  json,
  JSONValue,
  log,
} from "@graphprotocol/graph-ts";

import { DestBySource, SourceByDest } from "../common/crossTokenAddress";

import { ZERO_ADDRESS } from "../sdk/util/constants";

export function getCrossTokenAddress(
  tokenID: string,
  tokenChainID: BigInt,
  chainID: BigInt,
  crossChainID: BigInt
): Bytes {
  const key = tokenID
    .toLowerCase()
    .concat(":")
    .concat(chainID.toString())
    .concat(":")
    .concat(crossChainID.toString());

  let obj: JSONValue | null;
  if (tokenChainID != chainID) {
    obj = json.fromString(SourceByDest).toObject().get(key);
  } else {
    obj = json.fromString(DestBySource).toObject().get(key);
  }

  if (!obj) {
    log.warning("[getCrossTokenAddress] No crossTokenAddress for key: {}", [
      key,
    ]);

    return Bytes.fromUTF8(ZERO_ADDRESS);
  }

  return Bytes.fromUTF8(obj.toString());
}

export function truncateAddress(bAddr: Bytes): Address {
  return Address.fromString(
    bAddr.toHexString().replace("0x000000000000000000000000", "0x")
  );
}

export function normalizeAmount(amount: BigInt, decimals: i32): BigInt {
  if (decimals > 8) {
    amount = amount.div(BigInt.fromI32(10).pow((decimals - 8) as u8));
  }

  return amount;
}

export function denormalizeAmount(amount: BigInt, decimals: i32): BigInt {
  if (decimals > 8) {
    amount = amount.times(BigInt.fromI32(10).pow((decimals - 8) as u8));
  }

  return amount;
}
