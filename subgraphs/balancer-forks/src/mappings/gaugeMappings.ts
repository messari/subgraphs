import {
  updateFinancials,
  updatePoolSnapshots,
  updateUsageMetrics,
} from "../modules/Metrics";
import {
  getPoolFromGauge,
  updateControllerRewards,
  updateFactoryRewards,
  updateStakedOutputTokenAmount,
} from "../modules/Rewards";
import {
  Deposit,
  Withdraw,
  UpdateLiquidityLimit,
} from "../../generated/templates/Gauge/Gauge";

export function handleDeposit(event: Deposit): void {
  const gaugeAddress = event.address;
  const provider = event.params.provider;
  const poolAddress = getPoolFromGauge(gaugeAddress);

  if (!poolAddress) return;

  updateStakedOutputTokenAmount(poolAddress, gaugeAddress, event.block);
  updateControllerRewards(poolAddress, gaugeAddress, event.block);
  updateFactoryRewards(poolAddress, gaugeAddress, event.block);

  updateUsageMetrics(event.block, provider);
  updatePoolSnapshots(poolAddress, event.block);
  updateFinancials(event.block);
}

export function handleWithdraw(event: Withdraw): void {
  const gaugeAddress = event.address;
  const provider = event.params.provider;
  const poolAddress = getPoolFromGauge(gaugeAddress);

  if (!poolAddress) return;

  updateStakedOutputTokenAmount(poolAddress, gaugeAddress, event.block);
  updateControllerRewards(poolAddress, gaugeAddress, event.block);
  updateFactoryRewards(poolAddress, gaugeAddress, event.block);

  updateUsageMetrics(event.block, provider);
  updatePoolSnapshots(poolAddress, event.block);
  updateFinancials(event.block);
}

export function handleUpdateLiquidityLimit(event: UpdateLiquidityLimit): void {
  const gaugeAddress = event.address;
  const poolAddress = getPoolFromGauge(gaugeAddress);

  if (!poolAddress) return;

  updateStakedOutputTokenAmount(poolAddress, gaugeAddress, event.block);
  updateControllerRewards(poolAddress, gaugeAddress, event.block);
  updateFactoryRewards(poolAddress, gaugeAddress, event.block);
}
