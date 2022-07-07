import { BigDecimal, BigInt, ethereum, log } from "@graphprotocol/graph-ts";
import { NetworkConfigs } from "../../../../../configurations/configure";
import { MasterChefApeswap } from "../../../../../generated/MasterChef/MasterChefApeswap";
import {
  LiquidityPool,
  _HelperStore,
  _MasterChefStakingPool,
} from "../../../../../generated/schema";
import {
  BIGINT_ONE,
  BIGINT_ZERO,
  INT_ZERO,
  MasterChef,
  RECENT_BLOCK_THRESHOLD,
  UsageType,
} from "../../../../../src/common/constants";
import { getOrCreateToken } from "../../../../../src/common/getters";
import {
  findNativeTokenPerToken,
  updateNativeTokenPriceInUSD,
} from "../../../../../src/price/price";
import { getRewardsPerDay } from "../../../../../src/common/rewards";
import { convertTokenToDecimal } from "../../../../../src/common/utils/utils";
import { getOrCreateMasterChef } from "../helpers";

export function handleReward(
  event: ethereum.Event,
  pid: BigInt,
  amount: BigInt,
  usageType: string
): void {
  let poolContract = MasterChefApeswap.bind(event.address);
  let masterChefPool = getOrCreateMasterChefStakingPool(
    event,
    MasterChef.MASTERCHEF,
    pid,
    poolContract
  );
  let masterChef = getOrCreateMasterChef(event, MasterChef.MASTERCHEF);

  // If comes back null then it must be a uniswap v2 pool
  let pool = LiquidityPool.load(masterChefPool.poolAddress!);
  if (!pool) {
    return;
  }

  // Update staked amounts
  if (usageType == UsageType.DEPOSIT) {
    pool.stakedOutputTokenAmount = pool.stakedOutputTokenAmount!.plus(amount);
  } else {
    pool.stakedOutputTokenAmount = pool.stakedOutputTokenAmount!.minus(amount);
  }

  // Return if you have calculated rewards recently - Performance Boost
  if (
    event.block.number
      .minus(masterChefPool.lastRewardBlock)
      .lt(RECENT_BLOCK_THRESHOLD)
  ) {
    pool.save();
    return;
  }

  // Get necessary values from the master chef contract to calculate rewards
  let getPoolInfo = poolContract.try_poolInfo(pid);
  if (!getPoolInfo.reverted) {
    let poolInfo = getPoolInfo.value;
    masterChefPool.poolAllocPoint = poolInfo.value1;
  }

  // Get the bonus multiplier if it is applicable
  let getMuliplier = poolContract.try_getMultiplier(
    event.block.number.minus(BIGINT_ONE),
    event.block.number
  );
  if (!getMuliplier.reverted) {
    masterChefPool.multiplier = getMuliplier.value;
  }

  // Get the total allocation for all pools
  let getTotalAlloc = poolContract.try_totalAllocPoint();
  if (!getTotalAlloc.reverted) {
    masterChef.totalAllocPoint = getTotalAlloc.value;
  }

  // Actual total ape given out per block to users
  let getRewardTokenPerBlock = poolContract.try_cakePerBlock();
  if (!getRewardTokenPerBlock.reverted) {
    masterChef.adjustedRewardTokenRate = getRewardTokenPerBlock.value;
    masterChef.lastUpdatedRewardRate = event.block.number;
  }

  // Calculate Reward Emission per Block
  let poolRewardTokenRate = masterChef.adjustedRewardTokenRate
    .times(masterChefPool.poolAllocPoint)
    .div(masterChef.totalAllocPoint);

  let nativeToken = updateNativeTokenPriceInUSD();

  let rewardToken = getOrCreateToken(NetworkConfigs.getRewardToken());
  rewardToken.lastPriceUSD = findNativeTokenPerToken(rewardToken, nativeToken);

  let poolRewardTokenRateBigDecimal = new BigDecimal(poolRewardTokenRate);
  let poolRewardTokenPerDay = getRewardsPerDay(
    event.block.timestamp,
    event.block.number,
    poolRewardTokenRateBigDecimal,
    masterChef.rewardTokenInterval
  );

  pool.rewardTokenEmissionsAmount = [
    BigInt.fromString(poolRewardTokenPerDay.toString()),
  ];
  pool.rewardTokenEmissionsUSD = [
    convertTokenToDecimal(
      pool.rewardTokenEmissionsAmount![INT_ZERO],
      rewardToken.decimals
    ).times(rewardToken.lastPriceUSD!),
  ];

  masterChefPool.lastRewardBlock = event.block.number;

  masterChefPool.save();
  masterChef.save();
  rewardToken.save();
  nativeToken.save();
  pool.save();
}

function getOrCreateMasterChefStakingPool(
  event: ethereum.Event,
  masterChefType: string,
  pid: BigInt,
  poolContract: MasterChefApeswap
): _MasterChefStakingPool {
  let masterChefPool = _MasterChefStakingPool.load(
    masterChefType + "-" + pid.toString()
  );

  // Create entity to track masterchef pool mappings
  if (!masterChefPool) {
    masterChefPool = new _MasterChefStakingPool(
      masterChefType + "-" + pid.toString()
    );
    masterChefPool.poolAddress = poolContract
      .poolInfo(pid)
      .value0.toHexString();
    masterChefPool.multiplier = BIGINT_ONE;
    masterChefPool.poolAllocPoint = BIGINT_ZERO;
    masterChefPool.lastRewardBlock = event.block.number;
    log.warning("MASTERCHEF POOL CREATED: " + pid.toString(), []);

    masterChefPool.save();
  }

  return masterChefPool;
}
