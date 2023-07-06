import { BigInt } from "@graphprotocol/graph-ts";

export interface IMaths {
  INDEX_ONE(): BigInt;
  indexMul(x: BigInt, y: BigInt): BigInt;
  indexDiv(x: BigInt, y: BigInt): BigInt;
}
