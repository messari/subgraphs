import { Address } from "@graphprotocol/graph-ts";

import {
    Staked as StakedEvent,
    Withdrawn as WithdrawnEvent,
    RewardAdded as RewardAddedEvent,
    RewardsDurationUpdated as RewardsDurationUpdatedEvent,
    UpdatePeriodFinishCall
} from "../../generated/templates/MplReward/MplReward";

import { StakeType, ZERO_BI } from "../common/constants";
import { getOrCreateMarket, getOrCreateMplReward } from "../common/mappingHelpers/getOrCreate/markets";
import { getOrCreateToken } from "../common/mappingHelpers/getOrCreate/supporting";
import { createStake, createUnstake } from "../common/mappingHelpers/getOrCreate/transactions";
import { intervalUpdate } from "../common/mappingHelpers/update/intervalUpdate";
import { createEventFromCall } from "../common/utils";

export function handleStaked(event: StakedEvent): void {
    const mplRewardsAddress = event.address;
    const mplRewards = getOrCreateMplReward(event, mplRewardsAddress);
    const stakeToken = getOrCreateToken(Address.fromString(mplRewards.stakeToken));
    const market = getOrCreateMarket(event, Address.fromString(mplRewards.market));
    const stakeType = market.id == stakeToken.id ? StakeType.MPL_LP_REWARDS : StakeType.MPL_STAKE_REWARDS;

    ////
    // Create stake
    ////
    createStake(event, market, stakeToken, event.params.amount, stakeType);

    ////
    // Trigger interval update
    ////
    intervalUpdate(event, market);
}

export function handleWidthdrawn(event: WithdrawnEvent): void {
    const mplRewardsAddress = event.address;
    const mplRewards = getOrCreateMplReward(event, mplRewardsAddress);
    const stakeToken = getOrCreateToken(Address.fromString(mplRewards.stakeToken));
    const market = getOrCreateMarket(event, Address.fromString(mplRewards.market));
    const stakeType = market.id == stakeToken.id ? StakeType.MPL_LP_REWARDS : StakeType.MPL_STAKE_REWARDS;

    ////
    // Create unstake
    ////
    createUnstake(event, market, stakeToken, event.params.amount, stakeType);

    ////
    // Trigger interval update
    ////
    intervalUpdate(event, market);
}

export function handleRewardAdded(event: RewardAddedEvent): void {
    ////
    // Update mpl reward
    ////
    const mplReward = getOrCreateMplReward(event, event.address);

    const currentTimestamp = event.block.timestamp;
    const rewardAdded = event.params.reward;

    // Update rate
    if (mplReward.rewardDurationSec.gt(ZERO_BI)) {
        mplReward.rewardRatePerSecond =
            currentTimestamp >= mplReward.periodFinishedTimestamp
                ? rewardAdded.div(mplReward.rewardDurationSec) // No overlap, total reward devided by time
                : rewardAdded
                      .plus(
                          mplReward.periodFinishedTimestamp.minus(currentTimestamp).times(mplReward.rewardRatePerSecond)
                      )
                      .div(mplReward.rewardDurationSec); // Overlap with last reward, so account for last reward remainder
    } else {
        mplReward.rewardRatePerSecond = ZERO_BI;
    }

    // Update period finished
    mplReward.periodFinishedTimestamp = currentTimestamp.plus(mplReward.rewardDurationSec);

    mplReward.save();

    ////
    // Trigger interval update
    ////
    const market = getOrCreateMarket(event, Address.fromString(mplReward.market));
    intervalUpdate(event, market);
}

export function handleRewardsDurationUpdated(event: RewardsDurationUpdatedEvent): void {
    ////
    // Update mpl reward
    ////
    const mplReward = getOrCreateMplReward(event, event.address);
    mplReward.rewardDurationSec = event.params.newDuration;
    mplReward.save();

    ////
    // Trigger interval update
    ////
    const market = getOrCreateMarket(event, Address.fromString(mplReward.market));
    intervalUpdate(event, market);
}

export function handleUpdatePeriodFinish(call: UpdatePeriodFinishCall): void {
    ////
    // Update mpl reward
    ////
    const eventFromCall = createEventFromCall(call);
    const mplReward = getOrCreateMplReward(eventFromCall, call.to);
    mplReward.periodFinishedTimestamp = call.inputs.timestamp;
    mplReward.save();

    ////
    // Trigger interval update
    ////
    const market = getOrCreateMarket(eventFromCall, Address.fromString(mplReward.market));
    intervalUpdate(eventFromCall, market);
}
