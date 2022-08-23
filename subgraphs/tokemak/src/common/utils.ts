import { BigInt, BigDecimal, ethereum } from "@graphprotocol/graph-ts";
import { BIGDECIMAL_HUNDRED, BIGINT_TEN, BIGINT_THOUSAND } from "./constants";

export function getTimeInMillis(time: BigInt): BigInt {
  return time.times(BIGINT_THOUSAND);
}

export function getTimestampInMillis(block: ethereum.Block): BigInt {
  return block.timestamp.times(BIGINT_THOUSAND);
}

export function bigIntToPercentage(n: BigInt): BigDecimal {
  return n.toBigDecimal().div(BIGDECIMAL_HUNDRED);
}
export function convertTokenDecimals(amount: BigInt, inputDecimals: number, outputDecimals: number): BigInt {
  return amount.times(BIGINT_TEN.pow(u8(outputDecimals))).div(BIGINT_TEN.pow(u8(inputDecimals)));
}
export function readValue<T>(callResult: ethereum.CallResult<T>, defaultValue: T): T {
  return callResult.reverted ? defaultValue : callResult.value;
}
