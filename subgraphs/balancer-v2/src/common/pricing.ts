import {Address, BigDecimal, BigInt} from "@graphprotocol/graph-ts";
import {BIGDECIMAL_ZERO, USD_STABLE_ASSETS} from "./constants";
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

export function calculateTokenValueInUsd(tokenAmount: BigInt, stableAmount: BigInt, weightIn: BigInt | null, weightOut: BigInt | null): BigDecimal {
    if (weightIn && weightOut) {
        return tokenAmount.div(weightIn).div(stableAmount.div(weightOut)).toBigDecimal()
    }
    return tokenAmount.div(stableAmount).toBigDecimal()
}


export function isUSDStable(asset: Address): boolean {
    for (let i: i32 = 0; i < USD_STABLE_ASSETS.length; i++) {
        if (USD_STABLE_ASSETS[i] == asset) return true;
    }
    return false;
}