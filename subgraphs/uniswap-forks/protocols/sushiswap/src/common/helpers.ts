import { Address, BigInt, ethereum, log } from "@graphprotocol/graph-ts";
import {
  LiquidityPool,
  _MasterChef,
  _MasterChefStakingPool,
} from "../../../../generated/schema";
import { BIGINT_ONE, BIGINT_ZERO } from "../../../../src/common/constants";
import { NetworkConfigs } from "../../../../configurations/configure";
import { getOrCreateRewardToken } from "../../../../src/common/getters";

export function createMasterChefStakingPool(
  event: ethereum.Event,
  masterChefType: string,
  pid: BigInt,
  poolAddress: Address
): _MasterChefStakingPool {
  let masterChefPool = new _MasterChefStakingPool(
    masterChefType + "-" + pid.toString()
  );

  masterChefPool.poolAddress = poolAddress.toHexString();
  masterChefPool.multiplier = BIGINT_ONE;
  masterChefPool.poolAllocPoint = BIGINT_ZERO;
  masterChefPool.lastRewardBlock = event.block.number;
  log.warning("MASTERCHEF POOL CREATED: " + pid.toString()!, []);

  let pool = LiquidityPool.load(masterChefPool.poolAddress!);
  if (pool) {
    pool.rewardTokens = [
      getOrCreateRewardToken(NetworkConfigs.getRewardToken()).id,
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

  if (!masterChef) {
    masterChef = new _MasterChef(masterChefType);
    masterChef.totalAllocPoint = BIGINT_ZERO;
    masterChef.rewardTokenInterval = NetworkConfigs.getRewardIntervalType();
    masterChef.rewardTokenRate = NetworkConfigs.getRewardTokenRate();
    masterChef.adjustedRewardTokenRate = BIGINT_ZERO;
    masterChef.lastUpdatedRewardRate = BIGINT_ZERO;
    masterChef.save();
  }
  return masterChef;
}

// Update the total allocation for all pools whenever the allocation points are updated for a pool.
export function updateMasterChefTotalAllocation(
  event: ethereum.Event,
  oldPoolAlloc: BigInt,
  newPoolAlloc: BigInt,
  masterChefType: string
): _MasterChef {
  let masterChef = getOrCreateMasterChef(event, masterChefType);
  masterChef.totalAllocPoint = masterChef.totalAllocPoint.plus(
    newPoolAlloc.minus(oldPoolAlloc)
  );
  masterChef.save();

  return masterChef;
}
