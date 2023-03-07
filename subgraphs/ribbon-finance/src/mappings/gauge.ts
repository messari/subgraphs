import {
  updateFactoryRewards,
  updateRbnRewardsInfo,
  updateStakedOutputTokenAmount,
} from "../modules/Rewards";
import {
  Deposit,
  Withdraw,
  Withdrawn,
  Staked,
} from "../../generated/templates/LiquidityGauge/LiquidityGaugeV5";
import * as constants from "../common/constants";
import { Address } from "@graphprotocol/graph-ts";
import { updateVaultSnapshots } from "../modules/Metrics";
import { getOrCreateLiquidityGauge } from "../common/initializers";

export function handleGaugeDeposit(event: Deposit): void {
  const gaugeAddress = event.address;
  if (gaugeAddress.equals(constants.NULL.TYPE_ADDRESS)) return;

  const liquidityGauge = getOrCreateLiquidityGauge(gaugeAddress);

  const vaultAddress = Address.fromString(liquidityGauge.vault);
  if (vaultAddress.equals(constants.NULL.TYPE_ADDRESS)) return;

  updateStakedOutputTokenAmount(vaultAddress, gaugeAddress, event.block);
  updateRbnRewardsInfo(gaugeAddress, vaultAddress, event.block);
  updateVaultSnapshots(vaultAddress, event.block);
}

export function handleGaugeWithdraw(event: Withdraw): void {
  const gaugeAddress = event.address;
  if (gaugeAddress.equals(constants.NULL.TYPE_ADDRESS)) return;

  const liquidityGauge = getOrCreateLiquidityGauge(gaugeAddress);
  const vaultAddress = Address.fromString(liquidityGauge.vault);

  if (vaultAddress.equals(constants.NULL.TYPE_ADDRESS)) return;

  updateStakedOutputTokenAmount(vaultAddress, gaugeAddress, event.block);
  updateRbnRewardsInfo(gaugeAddress, vaultAddress, event.block);
  updateVaultSnapshots(vaultAddress, event.block);
}

export function handleMiningDeposit(event: Staked): void {
  const gaugeAddress = event.address;
  if (gaugeAddress.equals(constants.NULL.TYPE_ADDRESS)) return;

  const liquidityGauge = getOrCreateLiquidityGauge(gaugeAddress);

  const vaultAddress = Address.fromString(liquidityGauge.vault);
  if (vaultAddress.equals(constants.NULL.TYPE_ADDRESS)) return;

  updateStakedOutputTokenAmount(vaultAddress, gaugeAddress, event.block);
  updateFactoryRewards(vaultAddress, gaugeAddress, event.block);
  updateVaultSnapshots(vaultAddress, event.block);
}

export function handleMiningWithdraw(event: Withdrawn): void {
  const gaugeAddress = event.address;
  if (gaugeAddress.equals(constants.NULL.TYPE_ADDRESS)) return;

  const liquidityGauge = getOrCreateLiquidityGauge(gaugeAddress);

  const vaultAddress = Address.fromString(liquidityGauge.vault);
  if (vaultAddress.equals(constants.NULL.TYPE_ADDRESS)) return;

  updateStakedOutputTokenAmount(vaultAddress, gaugeAddress, event.block);
  updateFactoryRewards(vaultAddress, gaugeAddress, event.block);
  updateVaultSnapshots(vaultAddress, event.block);
}
