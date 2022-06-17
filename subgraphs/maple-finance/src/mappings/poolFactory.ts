import { PoolCreated as PoolCreatedEvent } from "../../generated/templates/PoolFactory/PoolFactory";
import { Pool as PoolTemplate, StakeLocker as StakeLockerTemplate } from "../../generated/templates";
import { getOrCreatePoolFactory } from "../common/mappingHelpers/getOrCreate/protocol";
import { getOrCreateToken } from "../common/mappingHelpers/getOrCreate/supporting";
import { getOrCreateMarket, getOrCreateStakeLocker } from "../common/mappingHelpers/getOrCreate/markets";

export function handlePoolCreated(event: PoolCreatedEvent): void {
    const poolAddress = event.params.pool;
    const stakeLockerAddress = event.params.stakeLocker;

    ////
    // Create pool and stake locker templates
    ////
    PoolTemplate.create(poolAddress);
    StakeLockerTemplate.create(stakeLockerAddress);

    const poolFactoryAddress = event.address;
    const inputTokenAddress = event.params.liquidityAsset;
    const outputTokenAddress = poolAddress;
    const stakeTokenAddress = event.params.stakeAsset;

    ////
    // Create the things the market references
    ////
    getOrCreatePoolFactory(event, poolFactoryAddress);
    getOrCreateToken(inputTokenAddress);
    getOrCreateToken(outputTokenAddress);
    getOrCreateToken(stakeTokenAddress);

    ////
    // Create market
    ////
    getOrCreateMarket(event, poolAddress);

    ////
    // Create the stake locker for this market
    ////
    getOrCreateStakeLocker(event, stakeLockerAddress);
}
