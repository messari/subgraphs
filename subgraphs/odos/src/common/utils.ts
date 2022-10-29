import { Address, BigDecimal, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { SwappedOutputsStruct } from "../../generated/OdosRouter/OdosRouter";
import { Token } from "../../generated/schema";
import {
  BIGDECIMAL_ONE,
  BIGDECIMAL_TEN,
  BIGDECIMAL_ZERO,
  INT_ONE,
  INT_ZERO,
  PRICE_OUTLIAR_THRESHOLD,
} from "./constants";
import { getOrCreateToken } from "./getters";

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

// Convert a list of Addresses to Strings
export function convertAddressesToStrings(addresses: Address[]): string[] {
  const strings: string[] = [];
  for (let i = 0; i < addresses.length; i++) {
    strings.push(addresses[i].toHexString());
  }
  return strings;
}

// Get USD value of tokens in a list and return a list
export function getUSDValues(tokens: Token[], amounts: BigInt[]): BigDecimal[] {
  const usdValues: BigDecimal[] = [];
  let usdValue: BigDecimal = BIGDECIMAL_ZERO;
  for (let i = 0; i < tokens.length; i++) {
    usdValue = tokens[i].lastPriceUSD!.times(
      convertTokenToDecimal(amounts[i], tokens[i].decimals)
    );

    usdValue.lt(PRICE_OUTLIAR_THRESHOLD)
      ? usdValues.push(usdValue)
      : usdValues.push(BIGDECIMAL_ZERO);
  }
  return usdValues;
}

// If an element in a list is a zero big decimal, impute the average of the other elements
export function imputeZeroValues(values: BigDecimal[]): BigDecimal[] {
  const nonZeroValues: BigDecimal[] = [];
  for (let i = 0; i < values.length; i++) {
    if (values[i] != BIGDECIMAL_ZERO) {
      nonZeroValues.push(values[i]);
    }
  }
  if (nonZeroValues.length == 0) {
    return values;
  }

  let nonZeroValuesSum = BIGDECIMAL_ZERO;
  for (let i = 0; i < values.length; i++) {
    nonZeroValuesSum = nonZeroValuesSum.plus(values[i]);
  }

  const average = nonZeroValuesSum.div(
    BigDecimal.fromString(nonZeroValues.length.toString())
  );
  for (let i = 0; i < values.length; i++) {
    if (values[i] == BIGDECIMAL_ZERO) {
      values[i] = average;
    }
  }
  return values;
}

// Get token ids from a list of tokens
export function getTokenIds(tokens: Token[]): string[] {
  const tokenIds: string[] = [];
  for (let i = 0; i < tokens.length; i++) {
    tokenIds.push(tokens[i].id);
  }
  return tokenIds;
}

// Check if any element in the array is zero
export function isZeroBigDecimalArray(array: BigDecimal[]): boolean {
  for (let i = 0; i < array.length; i++) {
    if (array[i].equals(BigDecimal.fromString("0"))) {
      return true;
    }
  }
  return false;
}

// Sum all elements of an array
export function sumBigDecimalArray(array: BigDecimal[]): BigDecimal {
  let sum = BIGDECIMAL_ZERO;
  for (let i = 0; i < array.length; i++) {
    sum = sum.plus(array[i]);
  }
  return sum;
}

// Get a list of token IDs from tokens
export function getTokensIds(tokens: Token[]): string[] {
  const tokenIds: string[] = [];
  for (let i = 0; i < tokens.length; i++) {
    tokenIds.push(tokens[i].id);
  }
  return tokenIds;
}

// Get tokens from string IDs
export function getTokensFromTokensIn(
  event: ethereum.Event,
  tokensIn: Address[]
): Token[] {
  const tokens: Token[] = [];
  for (let i = 0; i < tokensIn.length; i++) {
    tokens.push(getOrCreateToken(event, tokensIn[i].toHexString()));
  }
  return tokens;
}

// Get tokens from string IDs
export function getTokensFromTokensOut(
  event: ethereum.Event,
  tokensOut: SwappedOutputsStruct[]
): Token[] {
  const tokens: Token[] = [];
  for (let i = 0; i < tokensOut.length; i++) {
    tokens.push(
      getOrCreateToken(event, tokensOut[i].tokenAddress.toHexString())
    );
  }
  return tokens;
}

export function getTotalVolumeUSD(
  amountsInUSD: BigDecimal[],
  amountsOutUSD: BigDecimal[]
): BigDecimal {
  if (
    isZeroBigDecimalArray(amountsInUSD) &&
    !isZeroBigDecimalArray(amountsOutUSD)
  ) {
    return sumBigDecimalArray(amountsOutUSD);
  }
  return sumBigDecimalArray(amountsInUSD);
}
