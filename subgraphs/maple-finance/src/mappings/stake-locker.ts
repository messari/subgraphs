import { Address } from "@graphprotocol/graph-ts";
import { Stake as StakeEvent, Unstake as UnstakeEvent } from "../../generated/templates/StakeLocker/StakeLocker";
import { getOrCreateMarket } from "../common/mapping_helpers/market";
import { getOrCreateStakeLocker } from "../common/mapping_helpers/stakeLocker";
import { createStake, createUnstake } from "../common/mapping_helpers/transactions";

export function handleStake(event: StakeEvent): void {
    const stakeLocker = getOrCreateStakeLocker(event.address);
    const market = getOrCreateMarket(Address.fromString(stakeLocker.market));
    createStake(event, market, event.params.amount);
}

export function handleUnstake(event: UnstakeEvent): void {
    const stakeLocker = getOrCreateStakeLocker(event.address);
    const market = getOrCreateMarket(Address.fromString(stakeLocker.market));
    createUnstake(event, market, event.params.amount);
}
