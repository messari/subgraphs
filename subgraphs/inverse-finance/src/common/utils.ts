import { BigDecimal, BigInt } from "@graphprotocol/graph-ts";

// Converts snake case to kebab case and appends a hyphen.
// (e.g. "TRADING_FEE" to "trading-fee-"), mainly used to create entity IDs
export function enumToPrefix(snake: string): string {
  return snake.replace("_", "-") + "-";
}

// Prefix an ID with a enum string in order to differentiate IDs
// e.g. combine XPOOL, TRADING_FEE and 0x1234 into xpool-trading-fee-0x1234
export function prefixID(ID: string, enumString1: string, enumString2: string | null = null): string {
  let prefix = enumToPrefix(enumString1);
  if (enumString2 != null) {
    prefix += enumToPrefix(enumString2!);
  }
  return prefix + ID;
}

// returns 10^decimals
export function decimalsToBigDecimal(decimals: i32): BigDecimal {
  let bd = BigDecimal.fromString("1");
  for (let i = 0; i < decimals; i++) {
    bd = bd.times(BigDecimal.fromString("10"));
  }
  return bd;
}

//convert BigDecimal to BigInt by truncating the decimal places
export function BigDecimalTruncateToBigInt(x: BigDecimal): BigInt {
  let intStr = x.toString().split(".")[0]
  return BigInt.fromString(intStr)
}