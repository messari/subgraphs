import { Address, BigInt, ethereum, log } from "@graphprotocol/graph-ts";
import { _MasterChef, _MasterChefStakingPool } from "../../../../generated/schema";
import { BIGINT_ONE, BIGINT_ZERO } from "../../../../src/common/constants";
import { NetworkConfigs } from "../../../../configurations/configure";
import { MasterChef } from "./constants";
import { MiniChefSushiswap } from "../../../../generated/MiniChef/MiniChefSushiswap";

export function createMasterChefStakingPool(event: ethereum.Event, masterChefType: string, pid: BigInt, poolAddress: Address): _MasterChefStakingPool {
    let masterChefPool = new _MasterChefStakingPool(masterChefType + "-" + pid.toString());

    masterChefPool.poolAddress = poolAddress.toHexString();
    masterChefPool.multiplier = BIGINT_ONE;
    masterChefPool.poolAllocPoint = BIGINT_ZERO;
    masterChefPool.lastRewardBlock = event.block.number;
    log.warning("MASTERCHEF POOL CREATED: " + masterChefPool.poolAddress, [])

    masterChefPool.save();

    return masterChefPool
}

export function getOrCreateMasterChef(event: ethereum.Event, masterChefType: string): _MasterChef {
    let masterChef = _MasterChef.load(masterChefType);

    if (!masterChef) {
        masterChef = new _MasterChef(masterChefType);
        masterChef.totalAllocPoint = BIGINT_ZERO;
        masterChef.rewardTokenInterval = NetworkConfigs.getRewardIntervalType();
        masterChef.rewardTokenRate = NetworkConfigs.getRewardTokenRate();
        log.warning("MasterChef Type: " + masterChefType, [])
        if (masterChefType == MasterChef.MINICHEF) {
            let miniChefV2Contract = MiniChefSushiswap.bind(event.address);
            masterChef.adjustedRewardTokenRate = miniChefV2Contract.sushiPerSecond();
            log.warning("Adjusted Reward Rate: " + masterChef.adjustedRewardTokenRate.toString(), [])
        } else {
            masterChef.adjustedRewardTokenRate = BIGINT_ZERO;
        }
        masterChef.adjustedRewardTokenRate = BIGINT_ZERO;
        masterChef.lastUpdatedRewardRate = BIGINT_ZERO
        masterChef.save()
    }
    return masterChef
}

export function updateMasterChefTotalAllocation(event: ethereum.Event, oldPoolAlloc: BigInt, newPoolAlloc: BigInt, masterChefType: string): _MasterChef {
    let masterChef = getOrCreateMasterChef(event, masterChefType)
    masterChef.totalAllocPoint = masterChef.totalAllocPoint.plus(newPoolAlloc.minus(oldPoolAlloc))
    masterChef.save()

    return masterChef
}
