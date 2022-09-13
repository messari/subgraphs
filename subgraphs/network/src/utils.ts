import { BigDecimal, BigInt } from "@graphprotocol/graph-ts";

///////////////////
//// Utilities ////
///////////////////

export function hexToDecimal(hex: string): BigInt {
  return BigInt.fromI64(parseInt(hex, 16));
}

// turn exponent into a BigDecimal number
export function exponentToBigDecimal(decimals: i32): BigDecimal {
  let bigDecimal = BigDecimal.fromString("1");
  for (let i = 0; i < decimals; i++) {
    bigDecimal = bigDecimal.times(BigDecimal.fromString("10"));
  }
  return bigDecimal;
}
