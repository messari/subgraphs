import { Address } from "@graphprotocol/graph-ts";
import {
    Staked as StakedEvent,
    Withdrawn as WithdrawnEvent,
    RewardAdded as RewardAddedEvent,
    RewardsDurationUpdated as RewardsDurationUpdatedEvent,
    UpdatePeriodFinishCall
} from "../../generated/templates/MplRewards/MplRewards";

import { StakeType, ZERO_BI } from "../common/constants";
import { getOrCreateMarket, marketTick } from "../common/mapping_helpers/market";
import { getOrCreateMplReward } from "../common/mapping_helpers/mplReward";
import { getOrCreateToken } from "../common/mapping_helpers/token";
import { createStake, createUnstake } from "../common/mapping_helpers/transactions";

export function handleStaked(event: StakedEvent): void {
    const mplRewardsAddress = event.address;
    const mplRewards = getOrCreateMplReward(mplRewardsAddress);
    const stakeToken = getOrCreateToken(Address.fromString(mplRewards.stakeToken));
    const market = getOrCreateMarket(Address.fromString(mplRewards.market));
    const stakeType = market.id == stakeToken.id ? StakeType.MPL_LP_REWARDS : StakeType.MPL_STAKE_REWARDS;
    createStake(event, market, stakeToken, event.params.amount, stakeType);

    // Trigger market tick
    marketTick(market, event);
}

export function handleWidthdrawn(event: WithdrawnEvent): void {
    const mplRewardsAddress = event.address;
    const mplRewards = getOrCreateMplReward(mplRewardsAddress);
    const stakeToken = getOrCreateToken(Address.fromString(mplRewards.stakeToken));
    const market = getOrCreateMarket(Address.fromString(mplRewards.market));
    const stakeType = market.id == stakeToken.id ? StakeType.MPL_LP_REWARDS : StakeType.MPL_STAKE_REWARDS;
    createUnstake(event, market, stakeToken, event.params.amount, stakeType);

    // Trigger market tick
    marketTick(market, event);
}

export function handleRewardAdded(event: RewardAddedEvent): void {
    const mplReward = getOrCreateMplReward(event.address);

    // Update rate
    if (mplReward.rewardDurationSec.gt(ZERO_BI)) {
        const currentTimestamp = event.block.timestamp;
        const rewardAdded = event.params.reward;

        mplReward.rewardRatePerSecond =
            currentTimestamp >= mplReward.periodFinishedTimestamp
                ? rewardAdded.div(mplReward.rewardDurationSec) // No overlap, total reward devided by time
                : rewardAdded
                      .plus(
                          mplReward.periodFinishedTimestamp.minus(currentTimestamp).times(mplReward.rewardRatePerSecond)
                      )
                      .div(mplReward.rewardDurationSec); // Overlap with last reward, so account for last reward remainder

        // Update period finished
        mplReward.periodFinishedTimestamp = currentTimestamp.plus(mplReward.rewardDurationSec);

        mplReward.save();

        // Trigger market tick
        const market = getOrCreateMarket(Address.fromString(mplReward.market));
        marketTick(market, event);
    }
}

export function handleRewardsDurationUpdated(event: RewardsDurationUpdatedEvent): void {
    const mplReward = getOrCreateMplReward(event.address);
    mplReward.rewardDurationSec = event.params.newDuration;
    mplReward.save();

    // Trigger market tick
    const market = getOrCreateMarket(Address.fromString(mplReward.market));
    marketTick(market, event);
}

export function handleUpdatePeriodFinish(call: UpdatePeriodFinishCall): void {
    const mplReward = getOrCreateMplReward(call.to);
    mplReward.periodFinishedTimestamp = call.inputs.timestamp;
    mplReward.save();
}
