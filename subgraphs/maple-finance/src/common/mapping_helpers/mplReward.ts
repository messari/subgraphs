import { Address, log } from "@graphprotocol/graph-ts";
import { Market, _MplReward } from "../../../generated/schema";
import { MPL_REWARDS_DEFAULT_DURATION_TIME_S, ZERO_ADDRESS, ZERO_BI } from "../constants";
import { getOrCreateMarket } from "./market";
import { getOrCreateStakeLocker } from "./stakeLocker";
import { getOrCreateToken } from "./token";

/**
 * Get the mpl rewards at mplRewardAddress, or create it if it doesn't exist
 * Only mplRewardAddress is required for get, everything should be set for create
 */
export function getOrCreateMplReward(
    mplRewardAddress: Address,
    stakeTokenAddress: Address = ZERO_ADDRESS,
    rewardTokenAddress: Address = ZERO_ADDRESS
): _MplReward {
    let mplReward = _MplReward.load(mplRewardAddress.toHexString());

    if (!mplReward) {
        mplReward = new _MplReward(mplRewardAddress.toHexString());

        const rewardToken = getOrCreateToken(rewardTokenAddress);
        const stakeToken = getOrCreateToken(stakeTokenAddress);

        // Explicity load market, we need to see if it exists
        let market = Market.load(stakeTokenAddress.toHexString());

        if (market) {
            // MPL-LP
            market._mplRewardMplLp = mplReward.id;
        } else {
            // MPL-STAKE
            const stakeLocker = getOrCreateStakeLocker(stakeTokenAddress);
            market = getOrCreateMarket(Address.fromString(stakeLocker.market));
            market._mplRewardMplStake = mplReward.id;
        }

        mplReward.market = market.id;
        mplReward.stakeToken = stakeToken.id;
        mplReward.rewardToken = rewardToken.id;
        mplReward.rewardRatePerSecond = ZERO_BI;
        mplReward.rewardDurationSec = MPL_REWARDS_DEFAULT_DURATION_TIME_S;
        mplReward.periodFinishedTimestamp = ZERO_BI;
        mplReward.rewardTokenEmissionAmountPerDay = ZERO_BI;
        mplReward.rewardTokenEmissionsUSDPerDayUSD = ZERO_BI;

        market.save();

        if (ZERO_ADDRESS == stakeTokenAddress || ZERO_ADDRESS == rewardTokenAddress) {
            log.error("Created mpl rewards with invalid params: stakeTokenAddress={}, rewardTokenAddress={}", [
                stakeTokenAddress.toHexString(),
                rewardTokenAddress.toHexString()
            ]);
        }
    }

    mplReward.save();
    return mplReward;
}
