import { Address, BigDecimal, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { NetworkConfigs } from "../../../../../configurations/configure";
import { MasterChefV3TraderJoe } from "../../../../../generated/MasterChefV3/MasterChefV3TraderJoe";
import {
  LiquidityPool,
  _MasterChefStakingPool,
} from "../../../../../generated/schema";
import {
  getOrCreateRewardToken,
  getOrCreateToken,
} from "../../../../../src/common/getters";
import { getRewardsPerDay } from "../../../../../src/common/rewards";
import { getOrCreateMasterChef } from "../../../../../src/common/masterchef/helpers";
import {
  BIGINT_ZERO,
  INT_ZERO,
  MasterChef,
} from "../../../../../src/common/constants";
import {
  convertTokenToDecimal,
  roundToWholeNumber,
} from "../../../../../src/common/utils/utils";
import { getPoolRewardsWithBonus } from "./handleRewarder";

// Updated Liquidity pool staked amount and emmissions on a deposit to the masterchef contract.
export function updateMasterChef(
  event: ethereum.Event,
  pid: BigInt,
  amount: BigInt,
  user: Address // account depositing/withdrawing
): void {
  const masterChefV3Pool = _MasterChefStakingPool.load(
    MasterChef.MASTERCHEFV3 + "-" + pid.toString()
  )!;
  const masterchefV3Contract = MasterChefV3TraderJoe.bind(event.address);
  const masterChefV3 = getOrCreateMasterChef(event, MasterChef.MASTERCHEFV3);

  // Return if pool does not exist
  const pool = LiquidityPool.load(masterChefV3Pool.poolAddress!);
  if (!pool) {
    return;
  }

  const rewardToken = getOrCreateToken(NetworkConfigs.getRewardToken());
  pool.rewardTokens = [
    getOrCreateRewardToken(NetworkConfigs.getRewardToken()).id,
  ];

  // Get the amount of Joe tokens emitted for all pools per second.
  if (masterChefV3.lastUpdatedRewardRate != event.block.number) {
    const getJoePerSec = masterchefV3Contract.try_joePerSec();
    if (!getJoePerSec.reverted) {
      masterChefV3.adjustedRewardTokenRate = getJoePerSec.value;
    }
    masterChefV3.lastUpdatedRewardRate = event.block.number;
  }

  // Calculate Reward Emission per second to a specific pool
  // Pools are allocated based on their fraction of the total allocation times the rewards emitted per second
  const rewardAmountPerInterval = masterChefV3.adjustedRewardTokenRate
    .times(masterChefV3Pool.poolAllocPoint)
    .div(masterChefV3.totalAllocPoint);
  const rewardAmountPerIntervalBigDecimal = BigDecimal.fromString(
    rewardAmountPerInterval.toString()
  );

  // Based on the emissions rate for the pool, calculate the rewards per day for the pool.
  const rewardTokenPerDay = getRewardsPerDay(
    event.block.timestamp,
    event.block.number,
    rewardAmountPerIntervalBigDecimal,
    masterChefV3.rewardTokenInterval
  );

  // Update the amount of staked tokens after deposit
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

  masterChefV3Pool.lastRewardBlock = event.block.number;

  const rewards = getPoolRewardsWithBonus(
    event,
    masterChefV3,
    masterChefV3Pool,
    pool,
    user,
    amount.gt(BIGINT_ZERO)
  );
  if (rewards) {
    pool.rewardTokens = rewards.tokens;
    pool.rewardTokenEmissionsAmount = rewards.amounts;
    pool.rewardTokenEmissionsUSD = rewards.amountsUSD;
  }

  masterChefV3Pool.save();
  masterChefV3.save();
  rewardToken.save();
  pool.save();
}
