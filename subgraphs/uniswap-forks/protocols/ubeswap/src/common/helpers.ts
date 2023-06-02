import { Address, ethereum, BigInt, log } from "@graphprotocol/graph-ts";
import { NetworkConfigs } from "../../../../configurations/configure";
import { PoolManager } from "../../../../generated/PoolManager/PoolManager";
import { StakingRewards as StakingRewardsTemplate } from "../../../../generated/templates";
import {
  LiquidityPool,
  _MasterChef,
  _MasterChefStakingPool,
  _MasterChefAddressToPid,
} from "../../../../generated/schema";
import {
  BIGINT_ONE,
  BIGINT_ZERO,
  INT_ZERO,
  MasterChef,
  ONE_WEEK_IN_DAYS,
  RECENT_BLOCK_THRESHOLD,
} from "../../../../src/common/constants";
import {
  getLiquidityPool,
  getOrCreateRewardToken,
  getOrCreateToken,
} from "../../../../src/common/getters";
import { POOL_MANAGER } from "./constants";
import { convertTokenToDecimal } from "../../../../src/common/utils/utils";

// Create a MasterChefStaking pool using the MasterChef pid for id.
export function getOrCreateMasterChefStakingPool(
  event: ethereum.Event,
  masterChefType: string,
  pid: BigInt,
  poolAddress: Address
): _MasterChefStakingPool {
  let masterChefPool = _MasterChefStakingPool.load(
    masterChefType + "-" + pid.toString()
  );

  // Create entity to track masterchef pool mappings
  if (!masterChefPool) {
    const poolManager = PoolManager.bind(event.address);
    const poolInfo = poolManager.try_pools(poolAddress);

    // If the staking pool is found, create a map between the staking pool address and the pid.
    // This is used to find the staking pool pid given its address.
    // Also, generate a template here to track the staking pool events.
    if (!poolInfo.reverted) {
      const pidAddressMap = new _MasterChefAddressToPid(
        poolInfo.value.value2.toHexString()
      );

      pidAddressMap.pid = pid;
      pidAddressMap.save();

      StakingRewardsTemplate.create(poolInfo.value.value2);
    } else {
      log.warning(
        "Pool not found in pool manager. ID: " +
          pid.toString() +
          " Pool Address: " +
          poolAddress.toHexString(),
        []
      );
    }

    masterChefPool = new _MasterChefStakingPool(
      masterChefType + "-" + pid.toString()
    );

    masterChefPool.multiplier = BIGINT_ONE;
    masterChefPool.poolAllocPoint = BIGINT_ZERO;
    masterChefPool.lastRewardBlock = event.block.number;
    masterChefPool.poolAddress = poolAddress.toHexString();
    log.warning("MASTERCHEF POOL CREATED: " + pid.toString(), []);

    // Add a reward token to the liquidity pool since it now has an associated staking pool.
    const pool = LiquidityPool.load(masterChefPool.poolAddress!);
    if (pool) {
      pool.rewardTokens = [
        getOrCreateRewardToken(event, NetworkConfigs.getRewardToken()).id,
      ];
      pool.save();
    }
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

// Update the masterchef contract with the latest reward token rate.
export function updateRewardEmissions(event: ethereum.Event): void {
  // Process to load in liquidity pool data.
  const masterChefAddressPidMap = _MasterChefAddressToPid.load(
    event.address.toHexString()
  )!;
  const masterChefPool = _MasterChefStakingPool.load(
    MasterChef.MASTERCHEF + "-" + masterChefAddressPidMap.pid.toString()
  )!;
  const pool = getLiquidityPool(
    masterChefPool.poolAddress!,
    event.block.number
  );

  // Return if you have calculated rewards recently - Performance Boost
  if (
    event.block.number
      .minus(masterChefPool.lastRewardBlock)
      .lt(RECENT_BLOCK_THRESHOLD)
  ) {
    pool.save();
    return;
  }

  const poolManager = PoolManager.bind(Address.fromString(POOL_MANAGER));

  // Get the reward period and the expected rewards for this particular pool for this period.
  const period = poolManager.currentPeriod();
  const poolRewardForPeriod = poolManager.computeAmountForPool(
    Address.fromString(pool.id),
    period.value0
  );

  // Divide the rewards for this period by 7 because each period lasts one week.
  const poolRewardDailyAverage = poolRewardForPeriod.div(ONE_WEEK_IN_DAYS);
  const rewardToken = getOrCreateToken(event, NetworkConfigs.getRewardToken());

  // Update the emissions amount in quantity and USD value.
  pool.rewardTokenEmissionsAmount = [poolRewardDailyAverage];
  pool.rewardTokenEmissionsUSD = [
    convertTokenToDecimal(
      pool.rewardTokenEmissionsAmount![INT_ZERO],
      rewardToken.decimals
    ).times(rewardToken.lastPriceUSD!),
  ];

  masterChefPool.lastRewardBlock = event.block.number;

  masterChefPool.save();
  pool.save();
}

export function updateStakedAmount(
  event: ethereum.Event,
  amount: BigInt
): void {
  const masterChefAddressPidMap = _MasterChefAddressToPid.load(
    event.address.toHexString()
  )!;
  const masterChefPool = _MasterChefStakingPool.load(
    MasterChef.MASTERCHEF + "-" + masterChefAddressPidMap.pid.toString()
  )!;
  const pool = getLiquidityPool(
    masterChefPool.poolAddress!,
    event.block.number
  );

  pool.stakedOutputTokenAmount = !pool.stakedOutputTokenAmount
    ? amount
    : pool.stakedOutputTokenAmount!.plus(amount);

  pool.save();
}
