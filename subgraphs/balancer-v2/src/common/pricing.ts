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
        for (let i: i32 = 0; i < USD_STABLE_ASSETS.length; i++) {
            let pricingAssetInUSD = _TokenPrice.load(asset.toHexString());
            if (pricingAssetInUSD != null) {
                usdValue = value.times(pricingAssetInUSD.lastUsdPrice);
                break;
            }
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

export function calculatePrice(
    tokenA: Address,
    tokenB: Address,
    amountA: BigDecimal,
    amountB: BigDecimal,
    weightA: BigDecimal | null,
    weightB: BigDecimal | null
): {
    price: BigDecimal,
    token: Address | null
} {
    // If both tokens are stable the price is one
    if (isUSDStable(tokenB) && isUSDStable(tokenA)) return {
        price: BIGDECIMAL_ONE,
        token: null
    }

    // If one of both tokens is stable we can calculate how much the other token is worth in usd terms
    if (isUSDStable(tokenB)) return {
        price: calculateTokenValueInUsd(amountA, amountB, weightA, weightB),
        token: tokenA
    }
    if (isUSDStable(tokenA)) return {
        price: calculateTokenValueInUsd(amountB, amountA, weightB, weightA),
        token: tokenB
    }

    /**
     * Base assets are known tokens that we can make sure they have a pool with a stable token
     * Allowing us to calculate the price of other tokens, without the need of a stable coin
     * This is meant for tokens that do not share pools with stable coins (for example, COW)
     */

    // If both are base assets let's not re calculate price
    if (isBaseAsset(tokenA) && isBaseAsset(tokenB)) return {
        price: BIGDECIMAL_ZERO,
        token: null
    }

    if (isBaseAsset(tokenA)) {
        let token = _TokenPrice.load(tokenA.toHexString())
        if (token == null) return {
            price: BIGDECIMAL_ZERO,
            token: null
        }
        let stableAmountB = amountB.times(token.lastUsdPrice)
        return {
            price: calculateTokenValueInUsd(amountA, stableAmountB,null, null),
            token: tokenB
        }
    }

    if (isBaseAsset(tokenB)) {
        let token = _TokenPrice.load(tokenB.toHexString())
        if (token == null) return {
            price: BIGDECIMAL_ZERO,
            token: null
        }
        let stableAmountA = amountA.times(token.lastUsdPrice)
        return {
            price: calculateTokenValueInUsd(amountB, stableAmountA, null, null),
            token: tokenA
        }
    }
    return {
        price: BIGDECIMAL_ZERO,
        token: null
    }
}