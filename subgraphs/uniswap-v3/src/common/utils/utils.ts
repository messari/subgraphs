import { BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { LiquidityPool } from "../../../generated/schema";
import {
  BIGDECIMAL_HUNDRED,
  BIGDECIMAL_ONE,
  INT_ZERO,
  INT_ONE,
  BIGDECIMAL_TEN,
  BIGDECIMAL_TEN_THOUSAND,
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  BIGINT_ONE,
} from "../constants";
import { getLiquidityPoolFee } from "../getters";

export function percToDec(percentage: BigDecimal): BigDecimal {
  return percentage.div(BIGDECIMAL_HUNDRED);
}

export function calculateFee(pool: LiquidityPool, trackedAmountUSD: BigDecimal): BigDecimal[] {
  let tradingFee = getLiquidityPoolFee(pool.fees[0]);
  let protocolFee = getLiquidityPoolFee(pool.fees[1]);
  let tradingFeeAmount = trackedAmountUSD.times(percToDec(tradingFee.feePercentage));
  let protocolFeeAmount = trackedAmountUSD.times(percToDec(protocolFee.feePercentage));

  return [tradingFeeAmount, protocolFeeAmount];
}

export function exponentToBigDecimal(decimals: i32): BigDecimal {
  let bd = BIGDECIMAL_ONE;
  for (let i = INT_ZERO; i < (decimals as i32); i = i + INT_ONE) {
    bd = bd.times(BIGDECIMAL_TEN);
  }
  return bd;
}

export function exponentToBigDecimalBi(decimals: BigInt): BigDecimal {
  let bd = BIGDECIMAL_ONE;
  for (let i = BIGINT_ZERO; i.lt(decimals as BigInt); i = i.plus(BIGINT_ONE)) {
    bd = bd.times(BIGDECIMAL_TEN);
  }
  return bd;
}

export function convertTokenToDecimal(tokenAmount: BigInt, exchangeDecimals: i32): BigDecimal {
  if (exchangeDecimals == INT_ZERO) {
    return tokenAmount.toBigDecimal();
  }
  return tokenAmount.toBigDecimal().div(exponentToBigDecimal(exchangeDecimals));
}

export function convertFeeToPercent(fee: i64): BigDecimal {
  return BigDecimal.fromString(fee.toString()).div(BIGDECIMAL_TEN_THOUSAND);
}

// return 0 if denominator is 0 in division
export function safeDiv(amount0: BigDecimal, amount1: BigDecimal): BigDecimal {
  if (amount1.equals(BIGDECIMAL_ZERO)) {
    return BIGDECIMAL_ZERO;
  } else {
    return amount0.div(amount1);
  }
}

// convert list array to lowercase
export function toLowerCase(list: string[]): string[] {
  for (let i = 0; i < list.length; i++) {
    list[i] = list[i].toLowerCase();
  }
  return list;
}
