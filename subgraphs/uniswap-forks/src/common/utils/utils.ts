import { BigInt, BigDecimal, Bytes, ethereum } from "@graphprotocol/graph-ts";
import {
  BIGDECIMAL_HUNDRED,
  BIGDECIMAL_ONE,
  BIGDECIMAL_TEN,
  BIGDECIMAL_ZERO,
  INT_ONE,
  INT_ZERO,
} from "../constants";

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

// return 0 if denominator is 0 in division
export function safeDiv(amount0: BigDecimal, amount1: BigDecimal): BigDecimal {
  if (amount1.equals(BIGDECIMAL_ZERO)) {
    return BIGDECIMAL_ZERO;
  } else {
    return amount0.div(amount1);
  }
}

// convert string array to byte array
export function toBytesArray(arr: string[]): Bytes[] {
  let byteArr = new Array<Bytes>(arr.length);
  for (let i = 0; i < arr.length; i++) {
    byteArr[i] = Bytes.fromHexString(arr[i]);
  }
  return byteArr;
}

export function readValue<T>(
  callResult: ethereum.CallResult<T>,
  defaultValue: T
): T {
  return callResult.reverted ? defaultValue : callResult.value;
}

export function toPercentage(n: BigDecimal): BigDecimal {
  return n.div(BIGDECIMAL_HUNDRED);
}

// Convert a list of strings to lower case
export function toLowerCaseList(list: string[]): string[] {
  let lowerCaseList = new Array<string>(list.length);
  for (let i = 0; i < list.length; i++) {
    lowerCaseList[i] = list[i].toLowerCase();
  }
  return lowerCaseList;
}

export function toLowerCase(string: string): string {
  return string.toLowerCase();
}

// Round BigDecimal to whole number
export function roundToWholeNumber(n: BigDecimal): BigDecimal {
  return n.truncate(0);
}
