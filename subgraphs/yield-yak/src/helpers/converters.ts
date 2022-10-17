import { BigInt, BigDecimal } from "@graphprotocol/graph-ts";

// @ts-ignore
export function exponentToBigDecimal(decimals: i32): BigDecimal {
    let bd = BigDecimal.fromString("1");
    let bd10 = BigDecimal.fromString("10");

    for (let i = 0; i < decimals; i++) {
      bd = bd.times(bd10);
    }
    
    return bd;
}

// @ts-ignore
export function convertBINumToDesiredDecimals(value: BigInt, decimals: i32): BigDecimal {
    if (value == BigInt.fromString("0")) {
      return BigDecimal.fromString("0");
    } else {
      return value.toBigDecimal().div(exponentToBigDecimal(decimals));
    }
  }