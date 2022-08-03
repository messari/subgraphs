import { ethereum, BigInt, BigDecimal } from "@graphprotocol/graph-ts";
import { NetworkConfigs } from "../../../../../configurations/configure";
import {
  LiquidityPool,
  _MasterChef,
  _MasterChefStakingPool,
} from "../../../../../generated/schema";
import { INT_ZERO, MasterChef } from "../../../../../src/common/constants";
import { getOrCreateToken } from "../../../../../src/common/getters";
import { getRewardsPerDay } from "../../../../../src/common/rewards";
import {
  convertTokenToDecimal,
  roundToWholeNumber,
} from "../../../../../src/common/utils/utils";
import { getOrCreateMasterChef } from "../../../../../src/common/masterchef/helpers";

// Updated Liquidity pool staked amount and emmissions on a deposit to the masterchef contract.
export function updateMasterChef(
  event: ethereum.Event,
  pid: BigInt,
  amount: BigInt
): void {
  let miniChefV2Pool = _MasterChefStakingPool.load(
    MasterChef.MINICHEF + "-" + pid.toString()
  )!;
  let miniChefV2 = getOrCreateMasterChef(event, MasterChef.MINICHEF);

  let pool = LiquidityPool.load(miniChefV2Pool.poolAddress!);
  if (!pool) {
    return;
  }

  let rewardToken = getOrCreateToken(NetworkConfigs.getRewardToken());
  pool.rewardTokens = [rewardToken.id];

  // Calculate Reward Emission per second to a specific pool
  // Pools are allocated based on their fraction of the total allocation times the rewards emitted per second
  let rewardAmountPerInterval = miniChefV2.adjustedRewardTokenRate
    .times(miniChefV2Pool.poolAllocPoint)
    .div(miniChefV2.totalAllocPoint);
  let rewardAmountPerIntervalBigDecimal = new BigDecimal(
    rewardAmountPerInterval
  );

  // Based on the emissions rate for the pool, calculate the rewards per day for the pool.
  let rewardTokenPerDay = getRewardsPerDay(
    event.block.timestamp,
    event.block.number,
    rewardAmountPerIntervalBigDecimal,
    miniChefV2.rewardTokenInterval
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

  miniChefV2Pool.lastRewardBlock = event.block.number;

  miniChefV2Pool.save();
  miniChefV2.save();
  rewardToken.save();
  pool.save();
}
