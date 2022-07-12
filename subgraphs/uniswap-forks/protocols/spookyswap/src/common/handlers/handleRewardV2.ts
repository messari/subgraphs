import { BigDecimal, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { NetworkConfigs } from "../../../../../configurations/configure";
import { MasterChefV2Spookyswap } from "../../../../../generated/MasterChefV2/MasterChefV2Spookyswap";
import {
  LiquidityPool,
  _MasterChefStakingPool,
} from "../../../../../generated/schema";
import { INT_ZERO, MasterChef } from "../../../../../src/common/constants";
import {
  getOrCreateRewardToken,
  getOrCreateToken,
} from "../../../../../src/common/getters";
import { getRewardsPerDay } from "../../../../../src/common/rewards";
import {
  convertTokenToDecimal,
  roundToWholeNumber,
} from "../../../../../src/common/utils/utils";
import { getOrCreateMasterChef } from "../helpers";

// Updated Liquidity pool staked amount and emmissions on a deposit to the masterchef contract.
export function updateMasterChefDeposit(
  event: ethereum.Event,
  pid: BigInt,
  amount: BigInt
): void {
  let masterChefV2Pool = _MasterChefStakingPool.load(
    MasterChef.MASTERCHEFV2 + "-" + pid.toString()
  )!;
  let masterchefV2Contract = MasterChefV2Spookyswap.bind(event.address);
  let masterChefV2 = getOrCreateMasterChef(event, MasterChef.MASTERCHEFV2);

  // Return if pool does not exist
  let pool = LiquidityPool.load(masterChefV2Pool.poolAddress!);
  if (!pool) {
    return;
  } else {
    pool.rewardTokens = [
      getOrCreateRewardToken(NetworkConfigs.getRewardToken()).id,
    ];
  }

  // Get the amount of reward tokens emitted per block at this point in time.
  if (masterChefV2.lastUpdatedRewardRate != event.block.number) {
    let getSpookyPerBlock = masterchefV2Contract.try_booPerSecond();
    if (!getSpookyPerBlock.reverted) {
      masterChefV2.adjustedRewardTokenRate = getSpookyPerBlock.value;
    }
    masterChefV2.lastUpdatedRewardRate = event.block.number;
  }

  let nativeToken = getOrCreateToken(NetworkConfigs.getReferenceToken());
  let rewardToken = getOrCreateToken(NetworkConfigs.getRewardToken());

  // Calculate Reward Emission per second to a specific pool
  // Pools are allocated based on their fraction of the total allocation times the rewards emitted per block.
  let rewardAmountPerInterval = masterChefV2.adjustedRewardTokenRate
    .times(masterChefV2Pool.poolAllocPoint)
    .div(masterChefV2.totalAllocPoint);
  let rewardAmountPerIntervalBigDecimal = BigDecimal.fromString(
    rewardAmountPerInterval.toString()
  );

  // Based on the emissions rate for the pool, calculate the rewards per day for the pool.
  let rewardTokenPerDay = getRewardsPerDay(
    event.block.timestamp,
    event.block.number,
    rewardAmountPerIntervalBigDecimal,
    masterChefV2.rewardTokenInterval
  );

  // Update the amount of staked tokens after withdraw
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

  masterChefV2Pool.lastRewardBlock = event.block.number;

  masterChefV2Pool.save();
  masterChefV2.save();
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
  let masterChefV2Pool = _MasterChefStakingPool.load(
    MasterChef.MASTERCHEFV2 + "-" + pid.toString()
  )!;
  let masterchefV2Contract = MasterChefV2Spookyswap.bind(event.address);
  let masterChefV2 = getOrCreateMasterChef(event, MasterChef.MASTERCHEFV2);

  // Return if pool does not exist
  let pool = LiquidityPool.load(masterChefV2Pool.poolAddress!);
  if (!pool) {
    return;
  } else {
    pool.rewardTokens = [
      getOrCreateRewardToken(NetworkConfigs.getRewardToken()).id,
    ];
  }

  // Get the amount of reward tokens emitted per block at this point in time.
  if (masterChefV2.lastUpdatedRewardRate != event.block.number) {
    let getSpookyPerBlock = masterchefV2Contract.try_booPerSecond();
    if (!getSpookyPerBlock.reverted) {
      masterChefV2.adjustedRewardTokenRate = getSpookyPerBlock.value;
    }
    masterChefV2.lastUpdatedRewardRate = event.block.number;
  }

  let nativeToken = getOrCreateToken(NetworkConfigs.getReferenceToken());
  let rewardToken = getOrCreateToken(NetworkConfigs.getRewardToken());

  // Calculate Reward Emission per second to a specific pool
  // Pools are allocated based on their fraction of the total allocation times the rewards emitted per block.
  let rewardAmountPerInterval = masterChefV2.adjustedRewardTokenRate
    .times(masterChefV2Pool.poolAllocPoint)
    .div(masterChefV2.totalAllocPoint);
  let rewardAmountPerIntervalBigDecimal = BigDecimal.fromString(
    rewardAmountPerInterval.toString()
  );
  let rewardTokenPerDay = getRewardsPerDay(
    event.block.timestamp,
    event.block.number,
    rewardAmountPerIntervalBigDecimal,
    masterChefV2.rewardTokenInterval
  );

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

  masterChefV2Pool.lastRewardBlock = event.block.number;

  masterChefV2Pool.save();
  masterChefV2.save();
  rewardToken.save();
  nativeToken.save();
  pool.save();
}
