import { BigDecimal, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { BIGDECIMAL_ONE, BIGDECIMAL_TEN, INT_ONE, INT_ZERO } from "./constants";

// convert decimals
export function exponentToBigDecimal(decimals: i32): BigDecimal {
  let bd = BIGDECIMAL_ONE;
  for (let i = INT_ZERO; i < (decimals as i32); i = i + INT_ONE) {
    bd = bd.times(BIGDECIMAL_TEN);
  }
  return bd;
}

// convert emitted values to tokens count
export function convertTokenToDecimal(
  tokenAmount: BigInt,
  exchangeDecimals: i32
): BigDecimal {
  if (exchangeDecimals == INT_ZERO) {
    return tokenAmount.toBigDecimal();
  }

  return tokenAmount.toBigDecimal().div(exponentToBigDecimal(exchangeDecimals));
}

export function readValue<T>(
  callResult: ethereum.CallResult<T>,
  defaultValue: T
): T {
  return callResult.reverted ? defaultValue : callResult.value;
}
