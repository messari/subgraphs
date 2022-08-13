import { BigDecimal, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { NetworkConfigs } from "../../../../../configurations/configure";
import { MiniChefV2Apeswap } from "../../../../../generated/MiniChefV2/MiniChefV2Apeswap";
import {
  LiquidityPool,
  _HelperStore,
  _MasterChefStakingPool,
} from "../../../../../generated/schema";
import { INT_ZERO, MasterChef } from "../../../../../src/common/constants";
import {
  getOrCreateRewardToken,
  getOrCreateToken,
} from "../../../../../src/common/getters";
import { getRewardsPerDay } from "../../../../../src/common/rewards";
import { getOrCreateMasterChef } from "../../../../../src/common/masterchef/helpers";
import {
  convertTokenToDecimal,
  roundToWholeNumber,
} from "../../../../../src/common/utils/utils";

// Updated Liquidity pool staked amount and emmissions on a deposit to the masterchef contract.
export function updateMasterChef(
  event: ethereum.Event,
  pid: BigInt,
  amount: BigInt
): void {
  let masterChefV2Pool = _MasterChefStakingPool.load(
    MasterChef.MINICHEF + "-" + pid.toString()
  )!;
  let masterchefV2Contract = MiniChefV2Apeswap.bind(event.address);
  let masterChefV2 = getOrCreateMasterChef(event, MasterChef.MINICHEF);

  let pool = LiquidityPool.load(masterChefV2Pool.poolAddress!);
  if (!pool) {
    return;
  }

  let rewardToken = getOrCreateToken(NetworkConfigs.getRewardToken());
  pool.rewardTokens = [
    getOrCreateRewardToken(NetworkConfigs.getRewardToken()).id,
  ];

  // Get the amount of Banana tokens emitted for all pools per second.
  if (masterChefV2.lastUpdatedRewardRate != event.block.number) {
    let getBananaPerSecond = masterchefV2Contract.try_bananaPerSecond();
    if (!getBananaPerSecond.reverted) {
      masterChefV2.adjustedRewardTokenRate = getBananaPerSecond.value;
      masterChefV2.lastUpdatedRewardRate = event.block.number;
    }
  }

  // Calculate Reward Emission per second to a specific pool
  // Pools are allocated based on their fraction of the total allocation times the rewards emitted per second
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

  // Update the amount of staked tokens
  // Positive for deposits, negative for withdraws
  pool.stakedOutputTokenAmount = !pool.stakedOutputTokenAmount
    ? amount
    : pool.stakedOutputTokenAmount!.plus(amount);
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
  pool.save();
}
