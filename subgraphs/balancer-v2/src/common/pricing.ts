import { Address, BigDecimal } from "@graphprotocol/graph-ts";
import { BASE_ASSETS, BIGDECIMAL_ONE, BIGDECIMAL_ZERO, USD_STABLE_ASSETS } from "./constants";
import { _TokenPrice, LiquidityPool } from "../../generated/schema";
import { log } from "matchstick-as";
import { scaleDown } from "./tokens";

export function valueInUSD(value: BigDecimal, asset: Address): BigDecimal {
  let usdValue = BIGDECIMAL_ZERO;
  let pricingAssetInUSD = _TokenPrice.load(asset.toHexString());
  if (pricingAssetInUSD != null) {
    usdValue = value.times(pricingAssetInUSD.lastUsdPrice);
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
  tokenIn: Address,
  amountIn: BigDecimal,
  weightIn: BigDecimal | null,
  tokenOut: Address,
  amountOut: BigDecimal,
  weightOut: BigDecimal | null,
): TokenInfo | null {
  // If both tokens are stable the price is one
  if (isUSDStable(tokenOut) && isUSDStable(tokenIn)) return null;

  // If one of both tokens is stable we can calculate how much the other token is worth in usd terms
  if (isUSDStable(tokenOut))
    return new TokenInfo(tokenIn, calculateTokenValueInUsd(amountIn, amountOut, weightIn, weightOut));
  if (isUSDStable(tokenIn))
    return new TokenInfo(tokenOut, calculateTokenValueInUsd(amountOut, amountIn, weightOut, weightIn));

  /**
   * Base assets are known tokens that we can make sure they have a pool with a stable token
   * Allowing us to calculate the price of other tokens, without the need of a stable coin
   * This is meant for tokens that do not share pools with stable coins (for example, COW)
   */

  let tokenInPrice = _TokenPrice.load(tokenIn.toHexString());
  let tokenOutPrice = _TokenPrice.load(tokenOut.toHexString());

  // TODO: Check which token has more liquidity
  // if (isBaseAsset(tokenIn) && isBaseAsset(tokenOut)) return null;

  if (isBaseAsset(tokenIn) && tokenInPrice) {
    amountIn = amountIn.times(tokenInPrice.lastUsdPrice);
    return new TokenInfo(tokenOut, calculateTokenValueInUsd(amountOut, amountIn, weightOut, weightIn));
  }

  if (isBaseAsset(tokenOut) && tokenOutPrice) {
    amountOut = amountOut.times(tokenOutPrice.lastUsdPrice);
    return new TokenInfo(tokenIn, calculateTokenValueInUsd(amountIn, amountOut, weightIn, weightOut));
  }

  return null;
}

export function swapValueInUSD(
  tokenIn: Address,
  tokenAmountIn: BigDecimal,
  tokenOut: Address,
  tokenAmountOut: BigDecimal,
): BigDecimal {
  if (isUSDStable(tokenIn)) return tokenAmountIn;
  if (isUSDStable(tokenOut)) return tokenAmountOut;

  let tokenInSwapValueUSD = valueInUSD(tokenAmountIn, tokenIn);
  let tokenOutSwapValueUSD = valueInUSD(tokenAmountOut, tokenOut);

  let divisor =
    tokenInSwapValueUSD.gt(BIGDECIMAL_ZERO) && tokenOutSwapValueUSD.gt(BIGDECIMAL_ZERO)
      ? BigDecimal.fromString("2")
      : BIGDECIMAL_ONE;
  return tokenInSwapValueUSD.plus(tokenOutSwapValueUSD).div(divisor);
}
