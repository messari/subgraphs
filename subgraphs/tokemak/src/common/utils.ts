import { BigInt, BigDecimal, ethereum } from "@graphprotocol/graph-ts";
import { BIGDECIMAL_HUNDRED, BIGINT_THOUSAND } from "./constants";

export function getTimeInMillis(time: BigInt): BigInt {
  return time.times(BIGINT_THOUSAND);
}

export function getTimestampInMillis(block: ethereum.Block): BigInt {
  return block.timestamp.times(BIGINT_THOUSAND);
}

export function bigIntToPercentage(n: BigInt): BigDecimal {
  return n.toBigDecimal().div(BIGDECIMAL_HUNDRED);
}
