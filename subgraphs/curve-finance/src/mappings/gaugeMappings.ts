import {
  updateFactoryRewards,
  updateControllerRewards,
  updateStakedOutputTokenAmount,
} from "../modules/Rewards";
import {
  Deposit,
  Withdraw,
} from "../../generated/templates/LiquidityGauge/Gauge";
import { getPoolFromGauge } from "../common/utils";

export function handleDeposit(event: Deposit): void {
  const gaugeAddress = event.address;

  const poolAddress = getPoolFromGauge(gaugeAddress);

  updateStakedOutputTokenAmount(poolAddress, gaugeAddress, event.block);
  updateControllerRewards(poolAddress, gaugeAddress, event.block);
  updateFactoryRewards(poolAddress, gaugeAddress, event.block);
}

export function handleWithdraw(event: Withdraw): void {
  const gaugeAddress = event.address;

  const poolAddress = getPoolFromGauge(gaugeAddress);

  updateStakedOutputTokenAmount(poolAddress, gaugeAddress, event.block);
  updateControllerRewards(poolAddress, gaugeAddress, event.block);
  updateFactoryRewards(poolAddress, gaugeAddress, event.block);
}
