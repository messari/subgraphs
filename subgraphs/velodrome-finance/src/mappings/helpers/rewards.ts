import { Address, BigInt } from "@graphprotocol/graph-ts";
import {
  LiquidityPool,
  RewardToken,
  _LiquidityGauge,
} from "../../../generated/schema";
import {
  BIGDECIMAL_ZERO,
  BIGINT_SEVEN,
  BIGINT_ZERO,
  VELO_ADDRESS,
} from "../../common/constants";
import { getOrCreateRewardToken, getOrCreateToken } from "../../common/getters";
import { applyDecimals } from "../../common/utils/numbers";

export function createGauge(pool: LiquidityPool): void {
  getOrCreateToken(Address.fromString(VELO_ADDRESS));
  const rewardToken = getOrCreateRewardToken(Address.fromString(VELO_ADDRESS));
  pool.rewardTokens = [rewardToken.id];
  pool.save();
}

export function killGauge(pool: LiquidityPool, gauge: _LiquidityGauge): void {
  gauge.active = false;
  gauge.save();

  pool.rewardTokenEmissionsAmount = [BIGINT_ZERO];
  pool.rewardTokenEmissionsUSD = [BIGDECIMAL_ZERO];
  pool.save();
}

export function updateStaked(
  pool: LiquidityPool,

  amount: BigInt,
  staking: boolean
): void {
  if (staking) {
    pool.stakedOutputTokenAmount = pool.stakedOutputTokenAmount!.plus(amount);
  } else {
    pool.stakedOutputTokenAmount = pool.stakedOutputTokenAmount!.minus(amount);
  }
  pool.save();
}

export function updateRewards(pool: LiquidityPool, amount: BigInt): void {
  const rewardTokenEmissionsAmount = amount.div(BIGINT_SEVEN);

  // Emissions are weekly
  pool.rewardTokenEmissionsAmount = [rewardTokenEmissionsAmount];

  const rewardTokens = pool.rewardTokens;
  if (rewardTokens) {
    const rewardToken = RewardToken.load(rewardTokens[0]);
    const token = getOrCreateToken(Address.fromString(rewardToken!.token));
    pool.rewardTokenEmissionsUSD = [
      applyDecimals(rewardTokenEmissionsAmount, token.decimals).times(
        token.lastPriceUSD!
      ),
    ];
  }

  pool.save();
}
