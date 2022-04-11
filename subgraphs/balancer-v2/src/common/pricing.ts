import {Address, BigDecimal, BigInt} from "@graphprotocol/graph-ts";
import {
    BASE_ASSETS,
    BIGDECIMAL_ONE,
    BIGDECIMAL_ZERO,
    BIGINT_ONE,
    BIGINT_ZERO,
    PRICING_ASSETS,
    USD_STABLE_ASSETS
} from "./constants";
import {_TokenPrice} from "../../generated/schema";

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

export function calculateTokenValueInUsd(tokenAmount: BigDecimal, stableAmount: BigDecimal, weightIn: BigDecimal | null, weightOut: BigDecimal | null): BigDecimal {
    if (tokenAmount.equals(BIGDECIMAL_ZERO) || stableAmount.equals(BIGDECIMAL_ZERO)) return BIGDECIMAL_ZERO
    const amountToDiv = weightIn && weightOut ? weightIn.div(stableAmount.div(weightOut)) : stableAmount
    return tokenAmount.div(amountToDiv)
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

export function isPricingAsset(asset: Address): boolean {
    for (let i: i32 = 0; i < PRICING_ASSETS.length; i++) {
        if (PRICING_ASSETS[i] == asset) return true;
    }
    return false;
}

export class TokenInfo {
    constructor(public address: Address, public price: BigDecimal) {}
}

export function calculatePrice(
    tokenA: Address,
    tokenB: Address,
    amountA: BigDecimal,
    amountB: BigDecimal,
    weightA: BigDecimal | null,
    weightB: BigDecimal | null
): TokenInfo | null {
    // If both tokens are stable the price is one
    if (isUSDStable(tokenB) && isUSDStable(tokenA)) return null

    // If one of both tokens is stable we can calculate how much the other token is worth in usd terms
    if (isUSDStable(tokenB)) return new TokenInfo(tokenA, calculateTokenValueInUsd(amountA, amountB, weightA, weightB))

    if (isUSDStable(tokenA)) return new TokenInfo(tokenB, calculateTokenValueInUsd(amountB, amountA, weightB, weightA))

    /**
     * Base assets are known tokens that we can make sure they have a pool with a stable token
     * Allowing us to calculate the price of other tokens, without the need of a stable coin
     * This is meant for tokens that do not share pools with stable coins (for example, COW)
     */

    // If both are base assets let's not re calculate price
    if (isBaseAsset(tokenA) && isBaseAsset(tokenB)) return null

    if (isBaseAsset(tokenA)) {
        let token = _TokenPrice.load(tokenA.toHexString())
        if (token == null) return null
        let stableAmountB = amountB.times(token.lastUsdPrice)
        return new TokenInfo(tokenB, calculateTokenValueInUsd(amountA, stableAmountB, weightA, weightB))
    }

    if (isBaseAsset(tokenB)) {
        let token = _TokenPrice.load(tokenB.toHexString())
        if (token == null) return null
        let stableAmountA = amountA.times(token.lastUsdPrice)
        return new TokenInfo(tokenA, calculateTokenValueInUsd(amountB, stableAmountA, weightB, weightA))
    }
    return null
}