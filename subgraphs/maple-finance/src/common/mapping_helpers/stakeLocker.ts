import { Address, log } from "@graphprotocol/graph-ts";
import { _StakeLocker } from "../../../generated/schema";
import { ZERO_BD, ZERO_BI } from "../constants";
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
    marketAddress: Address = Address.zero(),
    stakeTokenAddress: Address = Address.zero()
): _StakeLocker {
    const stakeLocker = new _StakeLocker(stakeLockerAddress.toHexString());
    const stakeToken = getOrCreateToken(stakeTokenAddress);

    if (!stakeLocker) {
        stakeLocker.market = marketAddress.toHexString();
        stakeLocker.stakeToken = stakeToken.id;
        stakeLocker.stakeTokenBalance = ZERO_BI;
        stakeLocker.stakeTokenBalanceInPoolInputTokens = ZERO_BI;
        stakeLocker.stakeTokenPriceUSD = ZERO_BD;
        stakeLocker.priceLastUpdatedBlock = ZERO_BI;
        stakeLocker.cumulativeStakeDefault = ZERO_BI;
        stakeLocker.cumulativeStakeDefaultInPoolInputTokens = ZERO_BI;
        stakeLocker.revenueInPoolInputTokens = ZERO_BI;
        stakeLocker.revenueUSD = ZERO_BD;

        if (Address.zero() == marketAddress || Address.zero() == stakeTokenAddress) {
            log.error("Created stake locker with invalid marketAddress ({}) or stakeTokenAddress ({})", [
                marketAddress.toHexString(),
                stakeTokenAddress.toHexString()
            ]);
        }
    }

    stakeLocker.save();
    return stakeLocker;
}
