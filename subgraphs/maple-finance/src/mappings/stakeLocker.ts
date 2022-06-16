import { Address } from "@graphprotocol/graph-ts";

import { Stake as StakeEvent, Unstake as UnstakeEvent } from "../../generated/templates/StakeLocker/StakeLocker";

import { StakeType } from "../common/constants";
import { getOrCreateMarket, getOrCreateStakeLocker } from "../common/mappingHelpers/getOrCreate/markets";
import { getOrCreateToken } from "../common/mappingHelpers/getOrCreate/supporting";
import { createStake, createUnstake } from "../common/mappingHelpers/getOrCreate/transactions";
import { marketTick } from "../common/mappingHelpers/update/market";

export function handleStake(event: StakeEvent): void {
    const stakeLocker = getOrCreateStakeLocker(event, event.address);
    const market = getOrCreateMarket(event, Address.fromString(stakeLocker.market));
    const stakeToken = getOrCreateToken(Address.fromString(stakeLocker.stakeToken));
    createStake(event, market, stakeToken, event.params.amount, StakeType.STAKE_LOCKER);

    // Update stakeLocker
    stakeLocker.save();

    // Trigger market tick
    marketTick(market, event);
}

export function handleUnstake(event: UnstakeEvent): void {
    const stakeLocker = getOrCreateStakeLocker(event, event.address);
    const market = getOrCreateMarket(event, Address.fromString(stakeLocker.market));
    const stakeToken = getOrCreateToken(Address.fromString(stakeLocker.stakeToken));
    createUnstake(event, market, stakeToken, event.params.amount, StakeType.STAKE_LOCKER);

    // Update stake token balance
    stakeLocker.stakeTokenBalance = stakeLocker.stakeTokenBalance.minus(event.params.amount);
    stakeLocker.save();

    // Trigger market tick
    marketTick(market, event);
}
