import {
  getOrCreateMasterChef,
  getOrCreatePool,
  initializeSDK,
} from "../../src/common/initializers";
import * as utils from "../common/utils";
import * as constants from "../common/constants";
import { RewardTokenType } from "../sdk/util/constants";
import { getRewardsPerDay } from "../../src/common/rewards";
import { _MasterChefStakingPool } from "../../generated/schema";
import { BigDecimal, BigInt, ethereum } from "@graphprotocol/graph-ts";

// Updated Liquidity pool staked amount and emmissions on a deposit to the masterchef contract.
export function updateMasterChef(
  event: ethereum.Event,
  pid: BigInt,
  amount: BigInt
): void {
  const sdk = initializeSDK(event);

  const masterChefV2Pool = _MasterChefStakingPool.load(
    constants.MasterChef.MASTERCHEFV2 + "-" + pid.toString()
  )!;
  const masterChefV2 = getOrCreateMasterChef(
    event,
    constants.MasterChef.MASTERCHEFV2
  );

  // Return if pool does not exist
  const pool = getOrCreatePool(sdk);
  if (!pool) {
    return;
  }

  const levelToken = sdk.Tokens.getOrCreateToken(constants.LEVEL_TOKEN_ADDRESS);

  // Calculate Reward Emission per second to a specific pool
  // Pools are allocated based on their fraction of the total allocation times the rewards emitted per second
  const rewardAmountPerInterval = masterChefV2.adjustedRewardTokenRate
    .times(masterChefV2Pool.poolAllocPoint)
    .div(masterChefV2.totalAllocPoint);
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

  // Update the amount of staked tokens after deposit
  // Positive for deposits, negative for withdraws
  pool.addStakedOutputTokenAmount(amount);

  pool.setRewardEmissions(
    RewardTokenType.DEPOSIT,
    levelToken,
    BigInt.fromString(utils.roundToWholeNumber(rewardTokenPerDay).toString())
  );

  masterChefV2Pool.lastRewardBlock = event.block.number;

  masterChefV2Pool.save();
  masterChefV2.save();
}
