import { Address, BigInt } from "@graphprotocol/graph-ts";

import {
  BIGDECIMAL_ZERO,
  BIGINT_SEVEN,
  BIGINT_ZERO,
} from "../../common/constants";
import { getOrCreateRewardToken, getOrCreateToken } from "../../common/getters";
import { applyDecimals } from "../../common/utils/numbers";
import { createLiquidityGauge } from "./entities";

import {
  LiquidityPool,
  RewardToken,
  _LiquidityGauge,
} from "../../../generated/schema";

export function createGauge(
  pool: LiquidityPool,
  gaugeAddress: Address,
  veloAddress: string
): void {
  createLiquidityGauge(gaugeAddress, Address.fromString(pool.id));
  getOrCreateToken(Address.fromString(veloAddress));
  const rewardToken = getOrCreateRewardToken(Address.fromString(veloAddress));
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
