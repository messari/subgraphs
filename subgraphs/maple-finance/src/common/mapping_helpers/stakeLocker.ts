import { Address, log } from "@graphprotocol/graph-ts";
import { _StakeLocker } from "../../../generated/schema";
import { ZERO_ADDRESS, ZERO_BD, ZERO_BI } from "../constants";
import { getOrCreateToken } from "./token";

/**
 * Get the stake locker with stakeLockerAddress, or create it if it doesn't exist
 * @param stakeLockerAddress address of the stake locker
 * @param marketAddress address of the market this belong to, only needed on creation
 * @param stakeTokenAddress address of the stake token this market has, only needed on creation
 * @returns
 */
export function getOrCreateStakeLocker(
    stakeLockerAddress: Address,
    marketAddress: Address = ZERO_ADDRESS,
    stakeTokenAddress: Address = ZERO_ADDRESS
): _StakeLocker {
    let stakeLocker = _StakeLocker.load(stakeLockerAddress.toHexString());

    if (!stakeLocker) {
        stakeLocker = new _StakeLocker(stakeLockerAddress.toHexString());

        stakeLocker.market = marketAddress.toHexString();
        stakeLocker.stakeToken = stakeTokenAddress.toHexString();
        stakeLocker.stakeTokenBalance = ZERO_BI;
        stakeLocker.stakeTokenBalanceInPoolInputTokens = ZERO_BI;
        stakeLocker.stakeTokenPriceUSD = ZERO_BD;
        stakeLocker.priceLastUpdatedBlock = ZERO_BI;
        stakeLocker.cumulativeStakeDefault = ZERO_BI;
        stakeLocker.cumulativeStakeDefaultInPoolInputTokens = ZERO_BI;
        stakeLocker.revenueInPoolInputTokens = ZERO_BI;
        stakeLocker.revenueUSD = ZERO_BD;

        if (ZERO_ADDRESS == marketAddress || ZERO_ADDRESS == stakeTokenAddress) {
            log.error("Created stake locker with invalid params: marketAddress ({}) or stakeTokenAddress ({})", [
                marketAddress.toHexString(),
                stakeTokenAddress.toHexString()
            ]);
        }
    }

    stakeLocker.save();
    return stakeLocker;
}
