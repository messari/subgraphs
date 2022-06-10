import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { IdleToken } from "../../../generated/AddressProvider/IdleToken";
import { TokenSnapshot } from "../../../generated/schema";
import { createTokenSnapshotID } from "../../services/snapshots";
import { BIGDECIMAL_ZERO } from "../constants";
import { getOrCreateToken } from "../getters";
import { bigIntToBigDecimal } from "../utils/numbers";
import { getUnderlyingTokenPrice } from "./underlying";

//@ts-ignore
export function isIdleToken(tokenAddress: Address): boolean {
    const contract = IdleToken.bind(tokenAddress);
    const idleCall = contract.try_IDLE();
    return idleCall.reverted ? false : true;
}


export function getIdleTokenPriceUSD(tokenAddress: Address, timestamp: BigInt): BigDecimal {
    let tokenSnapshot = TokenSnapshot.load(createTokenSnapshotID(tokenAddress, timestamp));
    if (tokenSnapshot) {
        return tokenSnapshot.price;
    }
    tokenSnapshot = new TokenSnapshot(createTokenSnapshotID(tokenAddress, timestamp));
    const contract = IdleToken.bind(tokenAddress);
    const tokenPriceCall = contract.try_tokenPrice();
    const underlyingTokenCall = contract.try_token();
    if (tokenPriceCall.reverted || underlyingTokenCall.reverted){
        return BIGDECIMAL_ZERO
    }
    const tokenPrice = tokenPriceCall.value;
    const underlyingToken = getOrCreateToken(underlyingTokenCall.value);
    const underlyingTokenPrice = getUnderlyingTokenPrice(underlyingTokenCall.value,timestamp);
    const priceUSD = underlyingTokenPrice.times(bigIntToBigDecimal(tokenPrice,underlyingToken.decimals));
    tokenSnapshot.price = priceUSD;
    tokenSnapshot.save();
    return priceUSD;
}