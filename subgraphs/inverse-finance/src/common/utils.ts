import { BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { SECONDS_PER_DAY } from "../../../compound-v2/src/common/utils/constants";
import { SECONDS_PER_HOUR } from "./constants";
import { toBigInt } from "../../../apeswap/src/utils/constant";

// Converts snake case to kebab case and appends a hyphen.
// (e.g. "TRADING_FEE" to "trading-fee-"), mainly used to create entity IDs
export function enumToPrefix(snake: string): string {
  return snake.replace("_", "-") + "-";
}

// Prefix an ID with a enum string in order to differentiate IDs
// e.g. combine TRADING_FEE and 0x1234 into TRADING-FEE-0x1234
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

// returns hours (24-hour format) from timestamp
export function timestampToHH(timestamp: i64): BigInt {
  let secondsPastMidnight = timestamp % SECONDS_PER_DAY;
  let hours = secondsPastMidnight / SECONDS_PER_HOUR;
  return BigInt.fromI32(hours);
}
