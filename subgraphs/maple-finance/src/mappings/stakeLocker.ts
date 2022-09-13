import { Address, BigInt, log } from "@graphprotocol/graph-ts";

import {
    Stake as StakeEvent,
    Unstake as UnstakeEvent,
    LossesRecognized as LossesRecognizedEvent
} from "../../generated/templates/StakeLocker/StakeLocker";

import { StakeType, ZERO_BI } from "../common/constants";
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

export function handleLossesRecognized(event: LossesRecognizedEvent): void {
    const stakeLocker = getOrCreateStakeLocker(event, event.address);
    const market = getOrCreateMarket(event, Address.fromString(stakeLocker.market));

    ////
    // Update stakeLocker
    ////
    stakeLocker.recognizedLosses = stakeLocker.recognizedLosses.plus(event.params.lossesRecognized);
    stakeLocker.save();

    ////
    // Trigger interval update
    ////
    intervalUpdate(event, market);
}
