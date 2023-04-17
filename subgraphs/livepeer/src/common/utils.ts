import { BigDecimal, BigInt, ethereum, log } from "@graphprotocol/graph-ts";
import * as constants from "./constants";

export function equalsIgnoreCase(a: string, b: string): boolean {
  return a.replace("-", "_").toLowerCase() == b.replace("-", "_").toLowerCase();
}

export function safeDiv(amount0: BigDecimal, amount1: BigDecimal): BigDecimal {
  if (amount1.equals(constants.BIGDECIMAL_ZERO)) {
    return constants.BIGDECIMAL_ZERO;
  } else {
    return amount0.div(amount1);
  }
}

export function readValue<T>(
  callResult: ethereum.CallResult<T>,
  defaultValue: T
): T {
  if (callResult.reverted)
    log.warning("[readValue] Contract call reverted", []);
  return callResult.reverted ? defaultValue : callResult.value;
}

export function bigIntToBigDecimal(
  bigInt: BigInt,
  decimals: number
): BigDecimal {
  return bigInt.divDecimal(
    constants.BIGINT_TEN.pow(decimals as u8).toBigDecimal()
  );
}

export function sqrtPriceX96ToTokenPrices(
  sqrtPriceX96: BigInt,
  token0Decimals: BigInt,
  token1Decimals: BigInt
): BigDecimal[] {
  const num = sqrtPriceX96.times(sqrtPriceX96).toBigDecimal();
  const denom = constants.QI92;
  const price1 = num
    .div(denom)
    .times(exponentToBigDecimal(token0Decimals))
    .div(exponentToBigDecimal(token1Decimals));

  const price0 = safeDiv(constants.BIGDECIMAL_ONE, price1);
  return [price0, price1];
}

export function exponentToBigDecimal(decimals: BigInt): BigDecimal {
  let bd = constants.BIGDECIMAL_ONE;
  for (
    let i = constants.BIGINT_ZERO;
    i.lt(decimals);
    i = i.plus(constants.BIGINT_ONE)
  ) {
    bd = bd.times(constants.BIGDECIMAL_TEN);
  }
  return bd;
}
