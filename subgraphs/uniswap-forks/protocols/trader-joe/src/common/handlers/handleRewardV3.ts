import { BigDecimal, BigInt, ethereum, log } from "@graphprotocol/graph-ts";
import { NetworkConfigs } from "../../../../../configurations/configure";
import { MasterChefV3TraderJoe } from "../../../../../generated/MasterChefV3/MasterChefV3TraderJoe";
import {
  LiquidityPool,
  _HelperStore,
  _MasterChefStakingPool,
} from "../../../../../generated/schema";
import {
  getOrCreateRewardToken,
  getOrCreateToken,
} from "../../../../../src/common/getters";
import { getRewardsPerDay } from "../../../../../src/common/rewards";
import { getOrCreateMasterChef } from "../helpers";
import { INT_ZERO, MasterChef } from "../../../../../src/common/constants";
import {
  convertTokenToDecimal,
  roundToWholeNumber,
} from "../../../../../src/common/utils/utils";

// Updated Liquidity pool staked amount and emmissions on a deposit to the masterchef contract.
export function updateMasterChefDeposit(
  event: ethereum.Event,
  pid: BigInt,
  amount: BigInt
): void {
  let masterChefV3Pool = _MasterChefStakingPool.load(
    MasterChef.MASTERCHEFV3 + "-" + pid.toString()
  )!;
  let masterchefV3Contract = MasterChefV3TraderJoe.bind(event.address);
  let masterChefV3 = getOrCreateMasterChef(event, MasterChef.MASTERCHEFV3);

  // Return if pool does not exist
  let pool = LiquidityPool.load(masterChefV3Pool.poolAddress!);
  if (!pool) {
    return;
  } else {
    pool.rewardTokens = [
      getOrCreateRewardToken(NetworkConfigs.getRewardToken()).id,
    ];
  }

  // Get the amount of Joe tokens emitted for all pools per second.
  if (masterChefV3.lastUpdatedRewardRate != event.block.number) {
    let getJoePerSec = masterchefV3Contract.try_joePerSec();
    if (!getJoePerSec.reverted) {
      masterChefV3.adjustedRewardTokenRate = getJoePerSec.value;
    }
    masterChefV3.lastUpdatedRewardRate = event.block.number;
  }

  let nativeToken = getOrCreateToken(NetworkConfigs.getReferenceToken());
  let rewardToken = getOrCreateToken(NetworkConfigs.getRewardToken());

  // Calculate Reward Emission per second to a specific pool
  // Pools are allocated based on their fraction of the total allocation times the rewards emitted per second
  let rewardAmountPerInterval = masterChefV3.adjustedRewardTokenRate
    .times(masterChefV3Pool.poolAllocPoint)
    .div(masterChefV3.totalAllocPoint);
  let rewardAmountPerIntervalBigDecimal = BigDecimal.fromString(
    rewardAmountPerInterval.toString()
  );

  // Based on the emissions rate for the pool, calculate the rewards per day for the pool.
  let rewardTokenPerDay = getRewardsPerDay(
    event.block.timestamp,
    event.block.number,
    rewardAmountPerIntervalBigDecimal,
    masterChefV3.rewardTokenInterval
  );

  // Update the amount of staked tokens after deposit
  pool.stakedOutputTokenAmount = pool.stakedOutputTokenAmount!.plus(amount);
  pool.rewardTokenEmissionsAmount = [
    BigInt.fromString(roundToWholeNumber(rewardTokenPerDay).toString()),
  ];
  pool.rewardTokenEmissionsUSD = [
    convertTokenToDecimal(
      pool.rewardTokenEmissionsAmount![INT_ZERO],
      rewardToken.decimals
    ).times(rewardToken.lastPriceUSD!),
  ];

  masterChefV3Pool.lastRewardBlock = event.block.number;

  masterChefV3Pool.save();
  masterChefV3.save();
  rewardToken.save();
  nativeToken.save();
  pool.save();
}

// Updated Liquidity pool staked amount and emmissions on a withdraw from the masterchef contract.
export function updateMasterChefWithdraw(
  event: ethereum.Event,
  pid: BigInt,
  amount: BigInt
): void {
  let masterChefV3Pool = _MasterChefStakingPool.load(
    MasterChef.MASTERCHEFV3 + "-" + pid.toString()
  )!;
  let masterchefV3Contract = MasterChefV3TraderJoe.bind(event.address);
  let masterChefV3 = getOrCreateMasterChef(event, MasterChef.MASTERCHEFV3);

  // Return if pool does not exist
  let pool = LiquidityPool.load(masterChefV3Pool.poolAddress!);
  if (!pool) {
    return;
  } else {
    pool.rewardTokens = [
      getOrCreateRewardToken(NetworkConfigs.getRewardToken()).id,
    ];
  }

  if (masterChefV3.lastUpdatedRewardRate != event.block.number) {
    let getJoePerSec = masterchefV3Contract.try_joePerSec();
    if (!getJoePerSec.reverted) {
      masterChefV3.adjustedRewardTokenRate = getJoePerSec.value;
    }
    masterChefV3.lastUpdatedRewardRate = event.block.number;
  }

  let nativeToken = getOrCreateToken(NetworkConfigs.getReferenceToken());
  let rewardToken = getOrCreateToken(NetworkConfigs.getRewardToken());

  // Calculate Reward Emission per second to a specific pool
  // Pools are allocated based on their fraction of the total allocation times the rewards emitted per second
  let rewardAmountPerInterval = masterChefV3.adjustedRewardTokenRate
    .times(masterChefV3Pool.poolAllocPoint)
    .div(masterChefV3.totalAllocPoint);
  let rewardAmountPerIntervalBigDecimal = BigDecimal.fromString(
    rewardAmountPerInterval.toString()
  );

  // Based on the emissions rate for the pool, calculate the rewards per day for the pool.
  let rewardTokenPerDay = getRewardsPerDay(
    event.block.timestamp,
    event.block.number,
    rewardAmountPerIntervalBigDecimal,
    masterChefV3.rewardTokenInterval
  );

  // Update the amount of staked tokens after deposit
  pool.stakedOutputTokenAmount = pool.stakedOutputTokenAmount!.minus(amount);
  pool.rewardTokenEmissionsAmount = [
    BigInt.fromString(roundToWholeNumber(rewardTokenPerDay).toString()),
  ];
  pool.rewardTokenEmissionsUSD = [
    convertTokenToDecimal(
      pool.rewardTokenEmissionsAmount![INT_ZERO],
      rewardToken.decimals
    ).times(rewardToken.lastPriceUSD!),
  ];

  masterChefV3Pool.lastRewardBlock = event.block.number;

  masterChefV3Pool.save();
  masterChefV3.save();
  rewardToken.save();
  nativeToken.save();
  pool.save();
}
