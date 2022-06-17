import { Address } from "@graphprotocol/graph-ts";

import { Stake as StakeEvent, Unstake as UnstakeEvent } from "../../generated/templates/StakeLocker/StakeLocker";

import { StakeType } from "../common/constants";
import { getOrCreateMarket, getOrCreateStakeLocker } from "../common/mappingHelpers/getOrCreate/markets";
import { getOrCreateToken } from "../common/mappingHelpers/getOrCreate/supporting";
import { createStake, createUnstake } from "../common/mappingHelpers/getOrCreate/transactions";
import { intervalUpdate } from "../common/mappingHelpers/update/intervalUpdate";

export function handleStake(event: StakeEvent): void {
    const stakeLocker = getOrCreateStakeLocker(event, event.address);
    const market = getOrCreateMarket(event, Address.fromString(stakeLocker.market));
    const stakeToken = getOrCreateToken(Address.fromString(stakeLocker.stakeToken));

    ////
    // Create unstake
    ////
    const stake = createStake(event, market, stakeToken, event.params.amount, StakeType.STAKE_LOCKER);

    ////
    // Update stakeLocker
    ////
    stakeLocker.cumulativeStake = stakeLocker.cumulativeStake.plus(stake.amount);
    stakeLocker.save();

    ////
    // Trigger interval update
    ////
    intervalUpdate(event, market);
}

export function handleUnstake(event: UnstakeEvent): void {
    const stakeLocker = getOrCreateStakeLocker(event, event.address);
    const market = getOrCreateMarket(event, Address.fromString(stakeLocker.market));
    const stakeToken = getOrCreateToken(Address.fromString(stakeLocker.stakeToken));

    ////
    // Create stake
    ////
    const unstake = createUnstake(event, market, stakeToken, event.params.amount, StakeType.STAKE_LOCKER);

    ////
    // Update stakeLocker
    ////
    stakeLocker.cumulativeUnstake = stakeLocker.cumulativeUnstake.plus(unstake.amount);
    stakeLocker.save();

    ////
    // Trigger interval update
    ////
    intervalUpdate(event, market);
}
