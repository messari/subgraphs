import { PoolCreated as PoolCreatedEvent } from "../../generated/templates/PoolFactory/PoolFactory";
import { Pool as PoolTemplate, StakeLocker as StakeLockerTemplate } from "../../generated/templates";

import { getOrCreateMarket } from "../common/mapping_helpers/market";
import { getOrCreatePoolFactory } from "../common/mapping_helpers/poolFactory";
import { getOrCreateStakeLocker } from "../common/mapping_helpers/stakeLocker";
import { getOrCreateToken } from "../common/mapping_helpers/token";

export function handlePoolCreated(event: PoolCreatedEvent): void {
    const poolAddress = event.params.pool;
    const stakeLockerAddress = event.params.stakeLocker;

    // Create pool and stake locker templates
    PoolTemplate.create(poolAddress);
    StakeLockerTemplate.create(stakeLockerAddress);

    const marketName = event.params.name;
    const poolFactoryAddress = event.address;
    const delegateAddresss = event.params.delegate;
    const inputTokenAddress = event.params.liquidityAsset;
    const outputTokenAddress = poolAddress;
    const stakeTokenAddress = event.params.stakeAsset;

    // Create the things the market references
    getOrCreatePoolFactory(poolFactoryAddress);
    getOrCreateToken(inputTokenAddress);
    getOrCreateToken(outputTokenAddress);
    getOrCreateToken(stakeTokenAddress);
    getOrCreateStakeLocker(stakeLockerAddress, poolAddress, stakeTokenAddress);

    getOrCreateMarket(
        poolAddress,
        marketName,
        poolFactoryAddress,
        delegateAddresss,
        stakeLockerAddress,
        inputTokenAddress,
        outputTokenAddress,
        event.block.timestamp,
        event.block.number
    );
}
