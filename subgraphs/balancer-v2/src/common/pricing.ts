import { Address, BigDecimal } from "@graphprotocol/graph-ts";
import { BASE_ASSETS, BIGDECIMAL_ONE, BIGDECIMAL_ZERO, USD_STABLE_ASSETS } from "./constants";
import { Token } from "../../generated/schema";
import { getOrCreateDex, getOrCreateToken } from "./getters";
import { getUsdPrice } from "../prices";

export function valueInUSD(value: BigDecimal, asset: Address): BigDecimal {
  let usdValue = BIGDECIMAL_ZERO;
  let token = Token.load(asset.toHexString());
  let tokenPrice = token!.lastPriceUSD;
  if (isUSDStable(asset)) return value;
  if (token && tokenPrice) {
    usdValue = value.times(tokenPrice);
  }
  return usdValue;
}

export function calculateTokenValueInUsd(
  tokenAmount: BigDecimal,
  stableAmount: BigDecimal,
  tokenWeight: BigDecimal | null,
  stableWeight: BigDecimal | null,
): BigDecimal {
  if (tokenAmount.equals(BIGDECIMAL_ZERO) || stableAmount.equals(BIGDECIMAL_ZERO)) return BIGDECIMAL_ZERO;
  if (stableWeight && tokenWeight) {
    if (stableWeight.equals(BIGDECIMAL_ZERO) || tokenWeight.equals(BIGDECIMAL_ZERO)) return BIGDECIMAL_ZERO;
    return stableAmount.div(stableWeight).div(tokenAmount.div(tokenWeight));
  }
  return stableAmount.div(tokenAmount);
}

export function isUSDStable(asset: Address): boolean {
  for (let i: i32 = 0; i < USD_STABLE_ASSETS.length; i++) {
    if (USD_STABLE_ASSETS[i] == asset) return true;
  }
  return false;
}

export function isBaseAsset(asset: Address): boolean {
  for (let i: i32 = 0; i < BASE_ASSETS.length; i++) {
    if (BASE_ASSETS[i] == asset) return true;
  }
  return false;
}

export class TokenInfo {
  constructor(public address: Address, public price: BigDecimal) {}
}

export function calculatePrice(
  tokenInAddress: Address,
  amountIn: BigDecimal,
  weightIn: BigDecimal | null,
  tokenOutAddress: Address,
  amountOut: BigDecimal,
  weightOut: BigDecimal | null,
): TokenInfo | null {
  // If both tokens are stable the price is one
  if (isUSDStable(tokenOutAddress) && isUSDStable(tokenInAddress)) return null;

  // If one of both tokens is stable we can calculate how much the other token is worth in usd terms
  if (isUSDStable(tokenOutAddress)) {
    return new TokenInfo(tokenInAddress, calculateTokenValueInUsd(amountIn, amountOut, weightIn, weightOut));
  }
  if (isUSDStable(tokenInAddress)) {
    return new TokenInfo(tokenOutAddress, calculateTokenValueInUsd(amountOut, amountIn, weightOut, weightIn));
  }

  /**
   * Base assets are known tokens that we can make sure they have a pool with a stable token
   * Allowing us to calculate the price of other tokens, without the need of a stable coin
   * This is meant for tokens that do not share pools with stable coins (for example, COW)
   */

  let tokenInPrice = getOrCreateToken(tokenInAddress.toHexString()).lastPriceUSD;
  let tokenOutPrice = getOrCreateToken(tokenOutAddress.toHexString()).lastPriceUSD;

  if (isBaseAsset(tokenInAddress) && tokenInPrice) {
    amountIn = amountIn.times(tokenInPrice);
    return new TokenInfo(tokenOutAddress, calculateTokenValueInUsd(amountOut, amountIn, weightOut, weightIn));
  }

  if (isBaseAsset(tokenOutAddress) && tokenOutPrice) {
    amountOut = amountOut.times(tokenOutPrice);
    return new TokenInfo(tokenInAddress, calculateTokenValueInUsd(amountIn, amountOut, weightIn, weightOut));
  }

  return null;
}

/**
 * @param tokenAddress address of token to fetch price from
 * @returns Previously stored price, otherwise fetch it from oracle
 */
export function fetchPrice(tokenAddress: Address): BigDecimal {
  let token = Token.load(tokenAddress.toHexString());
  let tokenPrice: BigDecimal | null = null;
  if (token) tokenPrice = token.lastPriceUSD;
  if (tokenPrice) return tokenPrice;

  if (getOrCreateDex().network == "MATIC") return BIGDECIMAL_ZERO;
  return getUsdPrice(tokenAddress, BIGDECIMAL_ONE);
}
