import {Address, BigDecimal} from "@graphprotocol/graph-ts";
import {BIGDECIMAL_ZERO, USD_STABLE_ASSETS} from "./constants";

export function valueInUSD(value: BigDecimal, asset: Address): BigDecimal {
    let usdValue = BIGDECIMAL_ZERO;
    if (isUSDStable(asset)) {
        usdValue = value;
    } else {
        // convert to USD
        // for (let i: i32 = 0; i < USD_STABLE_ASSETS.length; i++) {
        //     let pricingAssetInUSD = LatestPrice.load(getLatestPriceId(pricingAsset, USD_STABLE_ASSETS[i]));
        //     if (pricingAssetInUSD != null) {
        //         usdValue = value.times(pricingAssetInUSD.price);
        //         break;
        //     }
        // }
    }

    return usdValue;
}


export function isUSDStable(asset: Address): boolean {
    for (let i: i32 = 0; i < USD_STABLE_ASSETS.length; i++) {
        if (USD_STABLE_ASSETS[i] == asset) return true;
    }
    return false;
}