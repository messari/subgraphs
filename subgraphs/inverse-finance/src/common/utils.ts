import { BigDecimal } from "@graphprotocol/graph-ts";

// Converts upper snake case to lower kebab case and appends a hyphen.
// (e.g. "TRADING_FEE" to "trading-fee-"), mainly used to create entity IDs
export function enumToPrefix(snake: string): string {
  return snake.toLowerCase().replace("_", "-") + "-";
}

// Prefix an ID with a enum string in order to differentiate IDs
// e.g. combine TRADING_FEE and 0x1234 into trading-fee-0x1234
export function prefixID(enumString: string, ID: string): string {
  return enumToPrefix(enumString) + ID;
}

// returns 10^decimals
export function decimalsToBigDecimal(decimals: i32): BigDecimal {
  let bd = BigDecimal.fromString("1");
  for (let i = 0; i < decimals; i++) {
    bd = bd.times(BigDecimal.fromString("10"));
  }
  return bd;
}
