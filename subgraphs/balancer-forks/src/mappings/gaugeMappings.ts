import {
  updateBalancerRewards,
  updateRewardTokenInfo,
} from "../modules/Rewards";
import * as utils from "../common/utils";
import {
  UpdateLiquidityLimit,
  RewardDistributorUpdated,
} from "../../generated/templates/Gauge/Gauge";

export function handleRewardDistributorUpdated(
  event: RewardDistributorUpdated
): void {}

export function handleUpdateLiquidityLimit(event: UpdateLiquidityLimit): void {
  const gaugeAddress = event.address;
  const poolAddress = utils.getPoolFromGauge(gaugeAddress);

  if (!poolAddress) return;

  updateBalancerRewards(poolAddress, gaugeAddress, event.block);
  updateRewardTokenInfo(poolAddress, gaugeAddress, event.block);
}
