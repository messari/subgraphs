import { Address, BigDecimal, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { LiquidityPool } from "../../generated/schema";
import { Ssov } from "../../generated/BasicWeeklyCalls/Ssov";
import { StakingStrategyV1 } from "../../generated/BasicWeeklyCalls/StakingStrategyV1";
import { StakingStrategyV2 } from "../../generated/BasicWeeklyCalls/StakingStrategyV2";
import { getOrCreateToken, getOrCreateRewardToken } from "../entities/token";
import { updatePoolRewardToken } from "../entities/pool";
import { bigDecimalToBigInt, convertTokenToDecimal } from "../utils/numbers";
import {
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  SECONDS_PER_DAY,
} from "../utils/constants";

export function updateRewards(
  event: ethereum.Event,
  pool: LiquidityPool,
  epoch: BigInt,
  stakingStrategyAddress: Address
): void {
  const ssovContract = Ssov.bind(Address.fromBytes(pool.id));
  const tryCurrentEpoch = ssovContract.try_currentEpoch();
  if (tryCurrentEpoch.reverted) {
    return;
  }
  const tryGetEpochTimes = ssovContract.try_getEpochTimes(
    tryCurrentEpoch.value
  );
  if (tryGetEpochTimes.reverted) {
    return;
  }
  const daysInEpoch = tryGetEpochTimes.value
    .getEnd()
    .minus(tryGetEpochTimes.value.getStart())
    .divDecimal(new BigDecimal(BigInt.fromI32(SECONDS_PER_DAY)));

  const stakingStrategyV1Contract = StakingStrategyV1.bind(
    stakingStrategyAddress
  );
  const tryGetRewardTokens = stakingStrategyV1Contract.try_getRewardTokens();
  if (tryGetRewardTokens.reverted) {
    return;
  }
  const rewardTokens = tryGetRewardTokens.value;

  const rewardsPerEpoch: BigInt[] = [];
  let tryRewardsPerEpoch = stakingStrategyV1Contract.try_rewardsPerEpoch(epoch);
  if (!tryRewardsPerEpoch.reverted) {
    rewardsPerEpoch.push(tryRewardsPerEpoch.value);
  } else {
    const stakingStrategyV2Contract = StakingStrategyV2.bind(
      stakingStrategyAddress
    );
    for (let i = 0; i < rewardTokens.length; i++) {
      tryRewardsPerEpoch = stakingStrategyV2Contract.try_rewardsPerEpoch(
        epoch,
        BigInt.fromI32(i)
      );
      if (!tryRewardsPerEpoch.reverted) {
        rewardsPerEpoch.push(tryRewardsPerEpoch.value);
      }
    }
  }

  if (rewardTokens.length != rewardsPerEpoch.length) {
    return;
  }

  // Based on the emissions rate for the pool, calculate the rewards per day for the pool.
  let tokensPerDay = BIGINT_ZERO;
  for (let i = 0; i < rewardTokens.length; i++) {
    const rewardToken = getOrCreateRewardToken(event, rewardTokens[i]);
    const token = getOrCreateToken(event, rewardTokens[i]);
    if (daysInEpoch != BIGDECIMAL_ZERO) {
      tokensPerDay = bigDecimalToBigInt(
        rewardsPerEpoch[i].divDecimal(daysInEpoch)
      );
    }
    const tokensPerDayUSD = convertTokenToDecimal(
      tokensPerDay,
      token.decimals
    ).times(token.lastPriceUSD!);

    updatePoolRewardToken(
      event,
      pool,
      rewardToken,
      tokensPerDay,
      tokensPerDayUSD
    );
  }
}
