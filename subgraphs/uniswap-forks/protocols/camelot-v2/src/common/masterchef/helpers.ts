import { ethereum, BigInt, Address, log } from "@graphprotocol/graph-ts";
import { NetworkConfigs } from "../../../../../configurations/configure";
import {
  LiquidityPool,
  _MasterChef,
  _MasterChefStakingPool,
} from "../../../../../generated/schema";
import { BIGINT_ONE, BIGINT_ZERO } from "../../../../../src/common/constants";
import { getOrCreateToken } from "../../../../../src/common/getters";

export function createMasterChefStakingPool(
  event: ethereum.Event,
  masterChefType: string,
  poolAddress: Address
): _MasterChefStakingPool {
  const masterChefPool = new _MasterChefStakingPool(
    masterChefType + "-" + poolAddress.toHexString()
  );

  masterChefPool.poolAddress = poolAddress.toHexString();
  masterChefPool.multiplier = BIGINT_ONE;
  masterChefPool.poolAllocPoint = BIGINT_ZERO;
  masterChefPool.lastRewardBlock = event.block.number;
  log.warning("MASTERCHEF POOL CREATED: " + poolAddress.toHexString(), []);

  const pool = LiquidityPool.load(masterChefPool.poolAddress!);
  if (pool) {
    pool.rewardTokens = [
      getOrCreateToken(event, NetworkConfigs.getRewardToken()).id,
    ];
    pool.save();
  }

  masterChefPool.save();

  return masterChefPool;
}

// Create the masterchef contract that contains data used to calculate rewards for all pools.
export function getOrCreateMasterChef(
  event: ethereum.Event,
  masterChefType: string
): _MasterChef {
  let masterChef = _MasterChef.load(masterChefType);

  if (masterChef) {
    if (masterChef.address) {
      return masterChef;
    }

    masterChef.address = event.address.toHexString();
    masterChef.save();
    return masterChef;
  }

  masterChef = new _MasterChef(masterChefType);
  masterChef.address = event.address.toHexString();
  masterChef.totalAllocPoint = BIGINT_ZERO;
  masterChef.rewardTokenInterval = NetworkConfigs.getRewardIntervalType();
  masterChef.rewardTokenRate = NetworkConfigs.getRewardTokenRate();
  log.warning("MasterChef Type: " + masterChefType, []);
  masterChef.adjustedRewardTokenRate = NetworkConfigs.getRewardTokenRate();
  masterChef.lastUpdatedRewardRate = BIGINT_ZERO;
  masterChef.save();

  return masterChef;
}

// Create a MasterChefStaking pool using the MasterChef pid for id.
export function getOrCreateMasterChefStakingPool(
  event: ethereum.Event,
  masterChefType: string,
  poolAddress: Address
): _MasterChefStakingPool {
  let masterChefPool = _MasterChefStakingPool.load(
    masterChefType + "-" + poolAddress.toHexString()
  );

  // Create entity to track masterchef pool mappings
  if (!masterChefPool) {
    masterChefPool = new _MasterChefStakingPool(
      masterChefType + "-" + poolAddress.toHexString()
    );

    masterChefPool.multiplier = BIGINT_ONE;
    masterChefPool.poolAllocPoint = BIGINT_ZERO;
    masterChefPool.lastRewardBlock = event.block.number;
    log.warning("MASTERCHEF POOL CREATED: " + poolAddress.toHexString(), []);

    masterChefPool.save();
  }

  return masterChefPool;
}

// Update the total allocation for all pools whenever the allocation points are updated for a pool.
export function updateMasterChefTotalAllocation(
  event: ethereum.Event,
  oldPoolAlloc: BigInt,
  newPoolAlloc: BigInt,
  masterChefType: string
): void {
  const masterChef = getOrCreateMasterChef(event, masterChefType);
  masterChef.totalAllocPoint = masterChef.totalAllocPoint.plus(
    newPoolAlloc.minus(oldPoolAlloc)
  );
  masterChef.save();
}
