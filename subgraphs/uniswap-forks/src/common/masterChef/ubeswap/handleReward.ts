import {
  BigInt,
  ethereum,
  Address,
  log,
} from "@graphprotocol/graph-ts";
import { LiquidityPool, _HelperStore } from "../../../../generated/schema";
import { StakeCall } from "../../../../generated/templates/StakingRewards/StakingRewards";
import {
  INT_ZERO
} from "../../constants";
import { getOrCreateToken } from "../../getters";
import {
  findNativeTokenPerToken,
  updateNativeTokenPriceInUSD,
} from "../../price/price";

export function handleStakedImpl(
  event: ethereum.Event,
  address : Address,
  amount: BigInt
): void {
  log.warning(" Staked to {}  from {}   amount : {}", [event.address.toHexString(),address.toHexString(),  amount.toString()]);
  // Return if pool does not exist
  let pool = LiquidityPool.load(event.address.toHexString());
  if (!pool) {
    return;
  }

  //pool.stakedOutputTokenAmount = pool.stakedOutputTokenAmount!.plus(amount);
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

export function handleRewardPaidImpl(
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
