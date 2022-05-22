import {
  BigDecimal,
  BigInt,
  ethereum,
  Address,
  log,
} from "@graphprotocol/graph-ts";
import { NetworkConfigs } from "../../../../config/configure";
import { LiquidityPool, _HelperStore } from "../../../../generated/schema";
import {
  BIGINT_FIVE,
  BIGINT_ONE,
  BIGINT_ZERO,
  INT_ZERO,
  UsageType,
  ZERO_ADDRESS,
} from "../../constants";
import { getOrCreateToken } from "../../getters";
import {
  findNativeTokenPerToken,
  updateNativeTokenPriceInUSD,
} from "../../price/price";
import { getRewardsPerDay } from "../../rewards";
import { StakingRewards } from "../../../../generated/templates/StakingRewards/StakingRewards";

export function handleStakedImpl(
  event: ethereum.Event,
  user: Address,
  amount: BigInt
): void {
  // Return if pool does not exist
  let pool = LiquidityPool.load(event.address.toHexString());
  if (!pool) {
    return;
  }
  pool.stakedOutputTokenAmount = pool.stakedOutputTokenAmount!.plus(amount);
  pool.save();
}

export function handleWithdrawnImpl(
  event: ethereum.Event,
  user: Address,
  amount: BigInt
): void {
  //Return if pool does not exist
  let pool = LiquidityPool.load(event.address.toHexString());
  if (!pool) {
    return;
  }
  pool.stakedOutputTokenAmount = pool.stakedOutputTokenAmount!.minus(amount);
  pool.save();
}

export function handleRewardPaidStakedImpl(
  event: ethereum.Event,
  user: Address,
  amount: BigInt
): void {
  // Return if pool does not exist
  let pool = LiquidityPool.load(event.address.toHexString());
  if (!pool) {
    return;
  }
  let nativeToken = updateNativeTokenPriceInUSD();
  let rewardToken = getOrCreateToken(pool.rewardTokens![INT_ZERO]);
  rewardToken.lastPriceUSD = findNativeTokenPerToken(rewardToken, nativeToken);
  pool.rewardTokenEmissionsAmount![0].plus(amount);
  pool.rewardTokenEmissionsUSD![0].plus(
    amount.toBigDecimal().times(rewardToken.lastPriceUSD!)
  );
  nativeToken.save();
  rewardToken.save();
  pool.save();
}
