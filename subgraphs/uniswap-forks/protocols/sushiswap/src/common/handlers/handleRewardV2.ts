import { ethereum, BigInt, BigDecimal, log } from "@graphprotocol/graph-ts";
import { NetworkConfigs } from "../../../../../configurations/configure";
import {
  LiquidityPool,
  _MasterChefStakingPool,
} from "../../../../../generated/schema";
import {
  BIGINT_ZERO,
  INT_ZERO,
  MasterChef,
} from "../../../../../src/common/constants";
import {
  getOrCreateRewardToken,
  getOrCreateToken,
} from "../../../../../src/common/getters";
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
  const masterChefV2Pool = _MasterChefStakingPool.load(
    MasterChef.MASTERCHEFV2 + "-" + pid.toString()
  )!;
  const masterChefV2 = getOrCreateMasterChef(event, MasterChef.MASTERCHEFV2);

  // Return if pool does not exist
  const pool = LiquidityPool.load(masterChefV2Pool.poolAddress!);
  if (!pool) {
    return;
  }

  const rewardToken = getOrCreateToken(NetworkConfigs.getRewardToken());
  pool.rewardTokens = [
    getOrCreateRewardToken(NetworkConfigs.getRewardToken()).id,
  ];

  // Calculate Reward Emission per second to a specific pool
  // Pools are allocated based on their fraction of the total allocation times the rewards emitted per block.
  // Adjusted reward token rate is calculated in the MasterChefV1 handler since rewards feed in from MasterChefV1.
  let rewardAmountPerInterval: BigInt;
  if (masterChefV2.totalAllocPoint != BIGINT_ZERO) {
    rewardAmountPerInterval = masterChefV2.adjustedRewardTokenRate
      .times(masterChefV2Pool.poolAllocPoint)
      .div(masterChefV2.totalAllocPoint);
  } else {
    rewardAmountPerInterval = BIGINT_ZERO;
    log.warning(
      "TOTAL ALLOC POINT IS ZERO. POOL ALLOC POINT IS: " +
        masterChefV2Pool.poolAllocPoint.toString(),
      []
    );
  }

  const rewardAmountPerIntervalBigDecimal = BigDecimal.fromString(
    rewardAmountPerInterval.toString()
  );

  // Based on the emissions rate for the pool, calculate the rewards per day for the pool.
  const rewardTokenPerDay = getRewardsPerDay(
    event.block.timestamp,
    event.block.number,
    rewardAmountPerIntervalBigDecimal,
    masterChefV2.rewardTokenInterval
  );

  // Update the amount of staked LP tokens
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
