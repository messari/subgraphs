import { Address, BigInt, ethereum, log } from "@graphprotocol/graph-ts";
import { _PoolFactory } from "../../../generated/schema";
import { ZERO_BD, ZERO_BI } from "../constants";

/**
 * Get the pool factory at poolFactoryAddress, or create it if it doesn't exist
 * @param poolFactoryAddress address of the pool factory
 * @param creationBlockTimestamp timestamp this was created, only needed on creation
 * @param creationBlockNumber block this was created, only needed on creation
 * @returns pool factory
 */
export function getOrCreatePoolFactory(
    poolFactoryAddress: Address,
    creationBlockTimestamp: BigInt = ZERO_BI,
    creationBlockNumber: BigInt = ZERO_BI
): _PoolFactory {
    let poolFactory = _PoolFactory.load(poolFactoryAddress.toHexString());

    if (!poolFactory) {
        poolFactory = new _PoolFactory(poolFactoryAddress.toHexString());

        if (ZERO_BI == creationBlockNumber || ZERO_BI == creationBlockTimestamp) {
            log.error("Created pool factory with invalid creationBlockNumber ({}) or creationBlockTimestamp ({})", [
                creationBlockNumber.toString(),
                creationBlockTimestamp.toString()
            ]);
        }
    }

    // Update creation times if they haven't been
    if (ZERO_BI != creationBlockTimestamp && ZERO_BI == poolFactory.creationTimestamp) {
        poolFactory.creationTimestamp = creationBlockTimestamp;
    }

    if (ZERO_BI != creationBlockNumber && ZERO_BI == poolFactory.creationBlockNumber) {
        poolFactory.creationTimestamp = creationBlockNumber;
    }

    poolFactory.save();
    return poolFactory;
}
