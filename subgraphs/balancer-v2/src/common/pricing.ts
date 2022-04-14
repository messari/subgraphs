import { Address, BigDecimal } from "@graphprotocol/graph-ts";
import {
  BASE_ASSETS,
  BIGDECIMAL_ZERO,
  USD_STABLE_ASSETS,
} from "./constants";
import { _TokenPrice } from "../../generated/schema";

export function valueInUSD(value: BigDecimal, asset: Address): BigDecimal {
  let usdValue = BIGDECIMAL_ZERO;
  if (isUSDStable(asset)) {
    usdValue = value;
  } else {
    // convert to USD
    let pricingAssetInUSD = _TokenPrice.load(asset.toHexString());
    if (pricingAssetInUSD != null) {
      usdValue = value.times(pricingAssetInUSD.lastUsdPrice);
    }
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
    return stableAmount.div(stableWeight).div(tokenAmount.div(tokenWeight))
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
  tokenA: Address,
  amountA: BigDecimal,
  weightA: BigDecimal | null,
  tokenB: Address,
  amountB: BigDecimal,
  weightB: BigDecimal | null,
): TokenInfo | null {

  // If both tokens are stable the price is one
  if (isUSDStable(tokenB) && isUSDStable(tokenA)) return null;

  // If one of both tokens is stable we can calculate how much the other token is worth in usd terms
  if (isUSDStable(tokenB)) return new TokenInfo(tokenA, calculateTokenValueInUsd(amountA, amountB, weightA, weightB));
  if (isUSDStable(tokenA)) return new TokenInfo(tokenB, calculateTokenValueInUsd(amountB, amountA, weightB, weightA));

  /**
   * Base assets are known tokens that we can make sure they have a pool with a stable token
   * Allowing us to calculate the price of other tokens, without the need of a stable coin
   * This is meant for tokens that do not share pools with stable coins (for example, COW)
   */

  let tokenAPrice = _TokenPrice.load(tokenA.toHexString());
  let tokenBPrice = _TokenPrice.load(tokenB.toHexString());
  // If both are base assets let's not re calculate price

  // TODO: Check which token has more liquidity
  // if (isBaseAsset(tokenA) && isBaseAsset(tokenB)) return null;

  if (isBaseAsset(tokenA) && tokenAPrice) {
    let stableAmountA = amountA.times(tokenAPrice.lastUsdPrice);
    return new TokenInfo(tokenB, calculateTokenValueInUsd(amountB, stableAmountA, weightB, weightA));
  }

  if (isBaseAsset(tokenB) && tokenBPrice) {
    let stableAmountB = amountA.times(tokenBPrice.lastUsdPrice);
    return new TokenInfo(tokenA, calculateTokenValueInUsd(amountA, stableAmountB, weightA, weightB));
  }
  return null;
}
