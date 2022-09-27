import {
  LiquidityPool,
  _MasterChef,
  _MasterChefStakingPool,
} from "../../../generated/schema";
import * as constants from "../constants";
import { getOrCreateToken } from "../initializers";
import { log, BigInt, Address, ethereum } from "@graphprotocol/graph-ts";

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
  masterChefPool.multiplier = constants.BIGINT_ONE;
  masterChefPool.poolAllocPoint = constants.BIGINT_ZERO;
  masterChefPool.lastRewardBlock = event.block.number;
  log.warning("MASTERCHEF POOL CREATED: " + pid.toString(), []);

  let pool = LiquidityPool.load(masterChefPool.poolAddress!);
  if (pool) {
    pool.rewardTokens = [
      getOrCreateToken(constants.PROTOCOL_TOKEN_ADDRESS, event.block.number).id,
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
    masterChef.totalAllocPoint = constants.BIGINT_ZERO;
    masterChef.rewardTokenInterval = constants.INFLATION_INTERVAL;
    masterChef.rewardTokenRate = BigInt.fromString(
      constants.STARTING_INFLATION_RATE.toString()
    );
    log.warning("MasterChef Type: " + masterChefType, []);
    masterChef.adjustedRewardTokenRate = BigInt.fromString(
      constants.STARTING_INFLATION_RATE.toString()
    );
    masterChef.lastUpdatedRewardRate = constants.BIGINT_ZERO;
    masterChef.save();
  }
  return masterChef;
}

// Create a MasterChefStaking pool using the MasterChef pid for id.
export function getOrCreateMasterChefStakingPool(
  event: ethereum.Event,
  masterChefType: string,
  pid: BigInt
): _MasterChefStakingPool {
  let masterChefPool = _MasterChefStakingPool.load(
    masterChefType + "-" + pid.toString()
  );

  // Create entity to track masterchef pool mappings
  if (!masterChefPool) {
    masterChefPool = new _MasterChefStakingPool(
      masterChefType + "-" + pid.toString()
    );

    masterChefPool.multiplier = constants.BIGINT_ONE;
    masterChefPool.poolAllocPoint = constants.BIGINT_ZERO;
    masterChefPool.lastRewardBlock = event.block.number;
    log.warning("MASTERCHEF POOL CREATED: " + pid.toString(), []);

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
  let masterChef = getOrCreateMasterChef(event, masterChefType);
  masterChef.totalAllocPoint = masterChef.totalAllocPoint.plus(
    newPoolAlloc.minus(oldPoolAlloc)
  );
  masterChef.save();
}
