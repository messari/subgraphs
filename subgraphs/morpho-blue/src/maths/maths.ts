import { BigInt } from "@graphprotocol/graph-ts";

import { BIGINT_ONE } from "../sdk/constants";

export function mulDivUp(x: BigInt, y: BigInt, z: BigInt): BigInt {
  return x.times(y).plus(z.minus(BIGINT_ONE)).div(z);
}

export function mulDivDown(x: BigInt, y: BigInt, z: BigInt): BigInt {
  return x.times(y).div(z);
}
