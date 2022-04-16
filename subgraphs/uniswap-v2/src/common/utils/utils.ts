import { BigInt, BigDecimal, Bytes, ethereum } from "@graphprotocol/graph-ts"
import { BIGDECIMAL_ZERO, INT_ONE, INT_ZERO } from "./../constants"

// convert decimals 
export function exponentToBigDecimal(decimals: i32): BigDecimal {
  let bd = BigDecimal.fromString('1')
  for (let i = INT_ZERO; i < (decimals as i32); i = i + INT_ONE) {
    bd = bd.times(BigDecimal.fromString('10'))
  }
  return bd
}

// convert emitted values to tokens count
export function convertTokenToDecimal(tokenAmount: BigInt, exchangeDecimals: i32): BigDecimal {
  if (exchangeDecimals == INT_ZERO) {
    return tokenAmount.toBigDecimal()
  }
  return tokenAmount.toBigDecimal().div(exponentToBigDecimal(exchangeDecimals))
}

// return 0 if denominator is 0 in division
export function safeDiv(amount0: BigDecimal, amount1: BigDecimal): BigDecimal {
  if (amount1.equals(BIGDECIMAL_ZERO)) {
    return BIGDECIMAL_ZERO
  } else {
    return amount0.div(amount1)
  }
}

// convert string array to byte array
export function toBytesArray(arr: string[]): Bytes[] {
  let byteArr = new Array<Bytes>(arr.length)
    for (let i = 0; i < arr.length; i++) {
      byteArr[i] = Bytes.fromHexString(arr[i])
  } return byteArr
}

export function readValue<T>(
  callResult: ethereum.CallResult<T>,
  defaultValue: T
): T {
  return callResult.reverted ? defaultValue : callResult.value;
}