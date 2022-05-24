import {
  BigInt,
  ethereum,
  Address,
  log,
} from "@graphprotocol/graph-ts";
import { LiquidityPool, _HelperStore } from "../../../../generated/schema";
import { StakeCall } from "../../../../generated/templates/StakingRewards/StakingRewards";
import {
  INT_ZERO,
  DEFAULT_DECIMALS
} from "../../constants";
import { getOrCreateToken } from "../../getters";
import {
  findNativeTokenPerToken,
  updateNativeTokenPriceInUSD,
} from "../../price/price";
import { convertTokenToDecimal, exponentToBigDecimal } from "../../utils/utils";

export function handleStakedImpl(
  event: ethereum.Event,
  amount: BigInt
): void {
  // Return if pool does not exist
  let pool = LiquidityPool.load(event.address.toHexString());
  if (!pool) {
    return;
  }
  let stakeToken = getOrCreateToken(pool.inputTokens[0]);

  pool.stakedOutputTokenAmount = pool.stakedOutputTokenAmount!.plus(amount);
  pool.inputTokenBalances[0] = pool.stakedOutputTokenAmount!;

  let nativeToken = updateNativeTokenPriceInUSD();
  stakeToken.lastPriceUSD = findNativeTokenPerToken(stakeToken, nativeToken);
  if (stakeToken.lastPriceUSD) {
    pool.totalValueLockedUSD = convertTokenToDecimal(pool.stakedOutputTokenAmount!, stakeToken.decimals).times(stakeToken.lastPriceUSD!);
  }

  pool.save();
}

export function handleWithdrawnImpl(
  event: ethereum.Event,
  amount: BigInt
): void {
  //Return if pool does not exist
  let pool = LiquidityPool.load(event.address.toHexString());
  if (!pool) {
    return;
  }
  let stakeToken = getOrCreateToken(pool.inputTokens[0]);

  pool.stakedOutputTokenAmount = pool.stakedOutputTokenAmount!.minus(amount);
  pool.inputTokenBalances[0] = pool.stakedOutputTokenAmount!;

  let nativeToken = updateNativeTokenPriceInUSD();
  stakeToken.lastPriceUSD = findNativeTokenPerToken(stakeToken, nativeToken);
  if (stakeToken.lastPriceUSD) {
    pool.totalValueLockedUSD = convertTokenToDecimal(pool.stakedOutputTokenAmount!, stakeToken.decimals).times(stakeToken.lastPriceUSD!);
  }
  pool.save();
}

export function handleRewardPaidImpl(
  event: ethereum.Event,
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
  pool.rewardTokenEmissionsAmount![0] = pool.rewardTokenEmissionsAmount![0].plus(amount);
  pool.rewardTokenEmissionsUSD![0] = convertTokenToDecimal(pool.rewardTokenEmissionsAmount![0], rewardToken.decimals).plus(rewardToken.lastPriceUSD!);
  nativeToken.save();
  rewardToken.save();
  pool.save();
}

