import { Address, BigInt } from "@graphprotocol/graph-ts";
import { RewardToken } from "../../../generated/schema";
import {
  DistributeReward,
  GaugeCreated,
  GaugeKilled,
} from "../../../generated/Voter/Voter";
import {
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  RewardTokenType,
  VELO_ADDRESS,
} from "../../common/constants";
import {
  getLiquidityPool,
  getOrCreateRewardToken,
  getOrCreateToken,
} from "../../common/getters";
import { applyDecimals } from "../../common/utils/numbers";
import { getOrCreateGauge } from "./entities";

export function createGauge(event: GaugeCreated): void {
  let gauge = getOrCreateGauge(event.params.gauge);
  gauge.pool = event.params.pool.toHex();
  gauge.active = true;
  gauge.save();

  let pool = getLiquidityPool(event.params.pool);
  getOrCreateToken(Address.fromString(VELO_ADDRESS));
  let rewardToken = getOrCreateRewardToken(Address.fromString(VELO_ADDRESS));
  pool.rewardTokens = [rewardToken.id];
  pool.save();
}

export function killGauge(event: GaugeKilled): void {
  let gauge = getOrCreateGauge(event.params.gauge);
  gauge.active = false;
  gauge.save();

  let pool = getLiquidityPool(Address.fromString(gauge.pool));
  pool.rewardTokenEmissionsAmount = [BIGINT_ZERO];
  pool.rewardTokenEmissionsUSD = [BIGDECIMAL_ZERO];
  pool.save();
}

export function updateStaked(
  gaugeAddress: Address,
  amount: BigInt,
  staking: boolean
): void {
  let gauge = getOrCreateGauge(gaugeAddress);
  let pool = getLiquidityPool(Address.fromString(gauge.pool));
  if (staking) {
    pool.stakedOutputTokenAmount = pool.stakedOutputTokenAmount!.plus(amount);
  } else {
    pool.stakedOutputTokenAmount = pool.stakedOutputTokenAmount!.minus(amount);
  }
  pool.save();
}

export function updateRewards(event: DistributeReward): void {
  let gauge = getOrCreateGauge(event.params.gauge);

  let pool = getLiquidityPool(Address.fromString(gauge.pool));
  const rewardTokenEmissionsAmount = event.params.amount.div(BigInt.fromI32(7));

  // Emissions are weekly
  pool.rewardTokenEmissionsAmount = [rewardTokenEmissionsAmount];

  const rewardTokens = pool.rewardTokens;
  if (rewardTokens) {
    let rewardToken = RewardToken.load(rewardTokens[0])
    let token = getOrCreateToken(Address.fromString(rewardToken!.token));
    pool.rewardTokenEmissionsUSD = [
      applyDecimals(rewardTokenEmissionsAmount, token.decimals).times(
        token.lastPriceUSD!
      ),
    ];
  }

  pool.save();
}
