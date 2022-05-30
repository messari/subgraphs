import { Address } from "@graphprotocol/graph-ts";
import {
    Staked as StakedEvent,
    Withdrawn as WithdrawnEvent,
    RewardAdded as RewardAddedEvent,
    RewardsDurationUpdated as RewardsDurationUpdatedEvent,
    UpdatePeriodFinishCall
} from "../../generated/templates/MplRewards/MplRewards";
import { StakeType } from "../common/constants";
import { getOrCreateMarket } from "../common/mapping_helpers/market";
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
}

export function handleWidthdrawn(event: WithdrawnEvent): void {
    const mplRewardsAddress = event.address;
    const mplRewards = getOrCreateMplReward(mplRewardsAddress);
    const stakeToken = getOrCreateToken(Address.fromString(mplRewards.stakeToken));
    const market = getOrCreateMarket(Address.fromString(mplRewards.market));
    const stakeType = market.id == stakeToken.id ? StakeType.MPL_LP_REWARDS : StakeType.MPL_STAKE_REWARDS;
    createUnstake(event, market, stakeToken, event.params.amount, stakeType);
}

export function handleRewardAdded(event: RewardAddedEvent): void {
    const mplReward = getOrCreateMplReward(event.address);
    mplReward.rewardRatePerSecond = event.params.reward;
    mplReward.save();
}

export function handleRewardsDurationUpdated(event: RewardsDurationUpdatedEvent): void {
    const mplReward = getOrCreateMplReward(event.address);
    mplReward.rewardRatePerSecond = event.params.newDuration;
    mplReward.save();
}

export function handleUpdatePeriodFinish(call: UpdatePeriodFinishCall): void {
    const mplReward = getOrCreateMplReward(call.to);
    mplReward.periodFinishedTimestamp = call.inputs.timestamp;
    mplReward.save();
}
