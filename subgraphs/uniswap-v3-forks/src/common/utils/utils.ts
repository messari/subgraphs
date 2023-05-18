import { BigDecimal, BigInt, Bytes } from "@graphprotocol/graph-ts";
import { LiquidityPool, Token } from "../../../generated/schema";
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
  BIGINT_TEN,
  BIGDECIMAL_NEG_ONE,
  BIGINT_HUNDRED,
  BIGINT_TWO,
} from "../constants";
import { getLiquidityPoolFee } from "../entities/pool";

export function percToDec(percentage: BigDecimal): BigDecimal {
  return percentage.div(BIGDECIMAL_HUNDRED);
}

export function percToDecBI(percentage: BigInt): BigInt {
  return percentage.div(BIGINT_HUNDRED);
}

export function calculateFee(
  pool: LiquidityPool,
  trackedAmountUSD: BigDecimal
): BigDecimal[] {
  const tradingFee = getLiquidityPoolFee(pool.fees[0]);
  const protocolFee = getLiquidityPoolFee(pool.fees[1]);
  const tradingFeeAmount = trackedAmountUSD.times(
    percToDec(tradingFee.feePercentage!)
  );
  const protocolFeeAmount = trackedAmountUSD.times(
    percToDec(protocolFee.feePercentage!)
  );

  return [tradingFeeAmount, protocolFeeAmount];
}

export function exponentToBigDecimal(decimals: i32): BigDecimal {
  let bd = BIGDECIMAL_ONE;
  for (let i = INT_ZERO; i < (decimals as i32); i = i + INT_ONE) {
    bd = bd.times(BIGDECIMAL_TEN);
  }
  return bd;
}

export function exponentToBigInt(decimals: i32): BigInt {
  let bd = BIGINT_ONE;
  for (let i = INT_ZERO; i < (decimals as i32); i = i + INT_ONE) {
    bd = bd.times(BIGINT_TEN);
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

export function convertTokenToDecimal(
  tokenAmount: BigInt,
  exchangeDecimals: i32
): BigDecimal {
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

// return 0 if denominator is 0 in division
export function safeDivBigInt(amount0: BigInt, amount1: BigInt): BigInt {
  if (amount1.equals(BIGINT_ZERO)) {
    return BIGINT_ZERO;
  } else {
    return amount0.div(amount1);
  }
}

// Convert 2 BigInt to 2 BigDecimal and do a safe division on them
export function safeDivBigIntToBigDecimal(
  amount0: BigInt,
  amount1: BigInt
): BigDecimal {
  if (amount1.equals(BIGINT_ZERO)) {
    return BIGDECIMAL_ZERO;
  } else {
    return amount0.toBigDecimal().div(amount1.toBigDecimal());
  }
}

// Subtract multiple BigInt Lists from each other without using map.
export function subtractBigIntLists(
  list1: BigInt[],
  list2: BigInt[]
): BigInt[] {
  const result: BigInt[] = [];
  for (let i = 0; i < list1.length; i++) {
    result.push(list1[i].minus(list2[i]));
  }
  return result;
}

// Subtract multiple BigDecimal Lists from each other without using map.
export function subtractBigDecimalLists(
  list1: BigDecimal[],
  list2: BigDecimal[]
): BigDecimal[] {
  const result: BigDecimal[] = [];
  for (let i = 0; i < list1.length; i++) {
    result.push(list1[i].minus(list2[i]));
  }
  return result;
}

// convert list array to lowercase
export function toLowerCase(list: string[]): string[] {
  const lowerCaseList: string[] = [];
  for (let i = 0; i < list.length; i++) {
    lowerCaseList.push(list[i].toLowerCase());
  }

  return list;
}

export function bigDecimalExponentiated(
  base: BigDecimal,
  exponent: BigInt
): BigDecimal {
  let x = base;
  let y = BIGDECIMAL_ONE;
  let n = exponent;

  while (n > BIGINT_ONE) {
    if (n.mod(BIGINT_TWO) == BIGINT_ZERO) {
      x = x.times(x);
      n = n.div(BIGINT_TWO);
    } else {
      y = y.times(x);
      x = x.times(x);
      n = n.minus(BIGINT_ONE).div(BIGINT_TWO);
    }
  }

  return x.times(y);
}

// Turn a list of BigInts into a list of absolute value BigInts
export function absBigIntList(list: BigInt[]): BigInt[] {
  const absList: BigInt[] = [];
  for (let i = 0; i < list.length; i++) {
    absList.push(list[i].abs());
  }
  return absList;
}

// Get the absolute value of a BigDecimal
export function bigDecimalAbs(value: BigDecimal): BigDecimal {
  if (value.lt(BIGDECIMAL_ZERO)) {
    return value.times(BIGDECIMAL_NEG_ONE);
  }
  return value;
}

// Sum BigDecimal List
export function sumBigDecimalList(list: BigDecimal[]): BigDecimal {
  let sum = BIGDECIMAL_ZERO;
  for (let i = 0; i < list.length; i++) {
    sum = sum.plus(list[i]);
  }
  return sum;
}

// Sum BigDecimal Lists of the same length by index
export function sumBigDecimalListByIndex(lists: BigDecimal[][]): BigDecimal[] {
  const sum = new Array<BigDecimal>(lists[0].length).fill(BIGDECIMAL_ZERO);
  for (let i = 0; i < lists.length; i++) {
    for (let j = 0; j < lists[i].length; j++) {
      sum[j] = sum[j].plus(lists[i][j]);
    }
  }
  return sum;
}

// Sum BigInt Lists of same length by index
export function sumBigIntListByIndex(lists: BigInt[][]): BigInt[] {
  const sum = new Array<BigInt>(lists[0].length).fill(BIGINT_ZERO);
  for (let i = 0; i < lists.length; i++) {
    for (let j = 0; j < lists[i].length; j++) {
      sum[j] = sum[j].plus(lists[i][j]);
    }
  }
  return sum;
}

// Subtract BigInt Lists of same length by index
export function subtractBigIntListByIndex(lists: BigInt[][]): BigInt[] {
  const sum = new Array<BigInt>(lists[0].length).fill(BIGINT_ZERO);
  for (let i = 0; i < lists.length; i++) {
    for (let j = 0; j < lists[i].length; j++) {
      sum[j] = sum[j].minus(lists[i][j]);
    }
  }
  return sum;
}

// Get the average of a BigDecimal List
export function BigDecimalAverage(list: BigDecimal[]): BigDecimal {
  let sum = BIGDECIMAL_ZERO;
  for (let i = 0; i < list.length; i++) {
    sum = sum.plus(list[i]);
  }
  return sum.div(BigDecimal.fromString(list.length.toString()));
}

// Get values from a list of indices and a list
export function removeFromArrayNotInIndex<T>(x: T[], index: i32[]): T[] {
  const result = new Array<T>(x.length - index.length);
  let j = 0;
  for (let i = 0; i < x.length; i++) {
    if (!index.includes(i)) {
      continue;
    }
    result[j] = x[i];
    j++;
  }
  return result;
}

// Sum BigInt List
export function sumBigIntList(list: BigInt[]): BigInt {
  let sum = BIGINT_ZERO;
  for (let i = 0; i < list.length; i++) {
    sum = sum.plus(list[i]);
  }
  return sum;
}

// Convert BigIntList to BigDecimalList with token conversion
export function convertBigIntListToBigDecimalList(
  tokens: Token[],
  list: BigInt[]
): BigDecimal[] {
  const result = new Array<BigDecimal>(list.length);
  for (let i = 0; i < list.length; i++) {
    result[i] = convertTokenToDecimal(list[i], tokens[i].decimals);
  }
  return result;
}

// Save div BigDecimal
export function safeDivBigDecimal(
  numerator: BigDecimal,
  denominator: BigDecimal
): BigDecimal {
  if (denominator.equals(BIGDECIMAL_ZERO)) {
    return BIGDECIMAL_ZERO;
  } else {
    return numerator.div(denominator);
  }
}

// Convert string list to Bytes list
export function stringToBytesList(list: string[]): Bytes[] {
  const result = new Array<Bytes>(list.length);
  for (let i = 0; i < list.length; i++) {
    result[i] = Bytes.fromHexString(list[i]);
  }
  return result;
}

export function absBigDecimal(value: BigDecimal): BigDecimal {
  if (value.lt(BIGDECIMAL_ZERO)) {
    return value.times(BIGDECIMAL_NEG_ONE);
  }
  return value;
}
