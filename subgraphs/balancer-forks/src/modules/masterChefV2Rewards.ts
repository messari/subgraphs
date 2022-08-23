import {
  getOrCreateToken,
  getOrCreateRewardToken,
} from "../../src/common/initializers";
import * as utils from "../common/utils";
import * as constants from "../common/constants";
import { getRewardsPerDay } from "../../src/common/rewards";
import { BigDecimal, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { getOrCreateMasterChef } from "../../src/common/masterchef/helpers";
import { LiquidityPool, _MasterChefStakingPool } from "../../generated/schema";

// Updated Liquidity pool staked amount and emmissions on a deposit to the masterchef contract.
export function updateMasterChef(
  event: ethereum.Event,
  pid: BigInt,
  amount: BigInt
): void {
  let masterChefV2Pool = _MasterChefStakingPool.load(
    constants.MasterChef.MASTERCHEFV2 + "-" + pid.toString()
  )!;
  let masterChefV2 = getOrCreateMasterChef(
    event,
    constants.MasterChef.MASTERCHEFV2
  );

  // Return if pool does not exist
  let pool = LiquidityPool.load(masterChefV2Pool.poolAddress!);
  if (!pool) {
    return;
  }

  let rewardToken = getOrCreateToken(
    constants.PROTOCOL_TOKEN_ADDRESS,
    event.block.number
  );
  pool.rewardTokens = [
    getOrCreateRewardToken(
      constants.PROTOCOL_TOKEN_ADDRESS,
      constants.RewardTokenType.DEPOSIT,
      event.block
    ).id,
  ];

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

  // Update the amount of staked tokens after deposit
  // Positive for deposits, negative for withdraws
  pool.stakedOutputTokenAmount = !pool.stakedOutputTokenAmount
    ? amount
    : pool.stakedOutputTokenAmount!.plus(amount);
  pool.rewardTokenEmissionsAmount = [
    BigInt.fromString(utils.roundToWholeNumber(rewardTokenPerDay).toString()),
  ];
  pool.rewardTokenEmissionsUSD = [
    utils
      .convertTokenToDecimal(
        pool.rewardTokenEmissionsAmount![constants.INT_ZERO],
        rewardToken.decimals
      )
      .times(rewardToken.lastPriceUSD!),
  ];

  masterChefV2Pool.lastRewardBlock = event.block.number;

  masterChefV2Pool.save();
  masterChefV2.save();
  rewardToken.save();
  pool.save();
}
