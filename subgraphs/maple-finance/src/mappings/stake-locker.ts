import { Address } from "@graphprotocol/graph-ts";
import { Stake as StakeEvent, Unstake as UnstakeEvent } from "../../generated/templates/StakeLocker/StakeLocker";
import { StakeType } from "../common/constants";
import { getOrCreateMarket, marketTick } from "../common/mapping_helpers/market";

import { getOrCreateStakeLocker } from "../common/mapping_helpers/stakeLocker";
import { getOrCreateToken } from "../common/mapping_helpers/token";
import { createStake, createUnstake } from "../common/mapping_helpers/transactions";

export function handleStake(event: StakeEvent): void {
    const stakeLocker = getOrCreateStakeLocker(event.address);
    const market = getOrCreateMarket(Address.fromString(stakeLocker.market));
    const stakeToken = getOrCreateToken(Address.fromString(stakeLocker.stakeToken));
    createStake(event, market, stakeToken, event.params.amount, StakeType.STAKE_LOCKER);

    // Update stake token balance
    stakeLocker.stakeTokenBalance = stakeLocker.stakeTokenBalance.plus(event.params.amount);
    stakeLocker.save();

    // Trigger market tick
    marketTick(market, event);
}

export function handleUnstake(event: UnstakeEvent): void {
    const stakeLocker = getOrCreateStakeLocker(event.address);
    const market = getOrCreateMarket(Address.fromString(stakeLocker.market));
    const stakeToken = getOrCreateToken(Address.fromString(stakeLocker.stakeToken));
    createUnstake(event, market, stakeToken, event.params.amount, StakeType.STAKE_LOCKER);

    // Update stake token balance
    stakeLocker.stakeTokenBalance = stakeLocker.stakeTokenBalance.minus(event.params.amount);
    stakeLocker.save();

    // Trigger market tick
    marketTick(market, event);
}
