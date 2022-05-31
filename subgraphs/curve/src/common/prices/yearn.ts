import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { Iearn } from '../../../generated/AddressProvider/Iearn'
import { YearnTokenV2 } from '../../../generated/AddressProvider/YearnTokenV2'
import { TokenSnapshot } from "../../../generated/schema";
import { createTokenSnapshotID } from "../../services/snapshots";
import { BIGDECIMAL_ZERO } from "../constants";
import { getOrCreateToken } from "../getters";
import { bigIntToBigDecimal } from "../utils/numbers";
import { getUnderlyingTokenPrice } from "./underlying";

export function isIearnToken(tokenAddr: Address): boolean {
    let iearnContract = Iearn.bind(tokenAddr);
    const shareCall = iearnContract.try_getPricePerFullShare();
    if (!shareCall.reverted) {
        return true;
    }
    return false;
}

export function isYearnTokenV2(tokenAddr: Address): boolean {
    let yearnTokenV2Contract = YearnTokenV2.bind(tokenAddr);
    const shareCall = yearnTokenV2Contract.try_pricePerShare();
    if (!shareCall.reverted) {
        return true;
    }
    return false;
}

export function getIearnPriceUSD(tokenAddr: Address, timestamp: BigInt): BigDecimal {
    let tokenSnapshot = TokenSnapshot.load(createTokenSnapshotID(tokenAddr, timestamp));
    if (tokenSnapshot) {
        return tokenSnapshot.price;
    }
    tokenSnapshot = new TokenSnapshot(createTokenSnapshotID(tokenAddr, timestamp));
    let iearnContract = Iearn.bind(tokenAddr);
    const shareCall = iearnContract.try_getPricePerFullShare();
    const underlyingTokenCall = iearnContract.try_token();
    if (shareCall.reverted || underlyingTokenCall.reverted) {
        return BIGDECIMAL_ZERO;
    }
    const pricePerShare = bigIntToBigDecimal(shareCall.value, 18);
    const underlyingPriceUSD = getUnderlyingTokenPrice(underlyingTokenCall.value, timestamp);
    const priceUSD = pricePerShare.times(underlyingPriceUSD);
    tokenSnapshot.price = priceUSD;
    tokenSnapshot.save();
    return priceUSD;
}

export function getYearnTokenV2PriceUSD(tokenAddr: Address, timestamp: BigInt): BigDecimal {
    let tokenSnapshot = TokenSnapshot.load(createTokenSnapshotID(tokenAddr, timestamp));
    if (tokenSnapshot) {
        return tokenSnapshot.price;
    }
    tokenSnapshot = new TokenSnapshot(createTokenSnapshotID(tokenAddr, timestamp));
    let yearnContract = YearnTokenV2.bind(tokenAddr);
    const shareCall = yearnContract.try_pricePerShare();
    const underlyingTokenCall = yearnContract.try_token();
    if (shareCall.reverted || underlyingTokenCall.reverted) {
        return BIGDECIMAL_ZERO;
    }
    const pricePerShare = bigIntToBigDecimal(shareCall.value, getOrCreateToken(tokenAddr).decimals);
    const underlyingPriceUSD = getUnderlyingTokenPrice(underlyingTokenCall.value, timestamp);
    const priceUSD = pricePerShare.times(underlyingPriceUSD);
    tokenSnapshot.price = priceUSD;
    tokenSnapshot.save();
    return priceUSD;
}