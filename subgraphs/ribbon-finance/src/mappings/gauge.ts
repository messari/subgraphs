import * as constants from "../common/constants";
import { Address, log } from "@graphprotocol/graph-ts";
import {
  updateFactoryRewards,
  updateRbnRewardsInfo,
  updateStakedOutputTokenAmount,
} from "../modules/Rewards";
import { getOrCreateLiquidityGauge } from "../common/initalizers";
import {
  Deposit,
  Withdraw,
  Withdrawn,
  Staked,
  RewardPaid,
} from "../../generated/rAAVEThetaGauge/LiquidityGaugeV5";
import { updateVaultSnapshots } from "../modules/Metrics";

export function handleStake(event: Deposit): void {
  const gaugeAddress = event.address;
  if (gaugeAddress.equals(constants.NULL.TYPE_ADDRESS)) return;

  const liquidityGauge = getOrCreateLiquidityGauge(gaugeAddress);

  const vaultAddress = Address.fromString(liquidityGauge.vault);
  if (vaultAddress.equals(constants.NULL.TYPE_ADDRESS)) return;

  updateStakedOutputTokenAmount(vaultAddress, gaugeAddress, event.block);
  updateRbnRewardsInfo(gaugeAddress, vaultAddress, event.block);
  updateVaultSnapshots(vaultAddress, event.block);

  log.warning("[Stake] VaultAddress {}", [vaultAddress.toHexString()]);
}

export function handleUnstake(event: Withdraw): void {
  const gaugeAddress = event.address;
  if (gaugeAddress.equals(constants.NULL.TYPE_ADDRESS)) return;

  const liquidityGauge = getOrCreateLiquidityGauge(gaugeAddress);

  const vaultAddress = Address.fromString(liquidityGauge.vault);
  if (vaultAddress.equals(constants.NULL.TYPE_ADDRESS)) return;

  updateStakedOutputTokenAmount(vaultAddress, gaugeAddress, event.block);
  updateRbnRewardsInfo(gaugeAddress, vaultAddress, event.block);
  updateVaultSnapshots(vaultAddress, event.block);

  log.warning("[Unstake] VaultAddress {}", [vaultAddress.toHexString()]);
}

export function handleStaked(event: Staked): void {
  const gaugeAddress = event.address;
  if (gaugeAddress.equals(constants.NULL.TYPE_ADDRESS)) return;

  const liquidityGauge = getOrCreateLiquidityGauge(gaugeAddress);

  const vaultAddress = Address.fromString(liquidityGauge.vault);
  log.warning("[Staked] VaultAddress {}", [vaultAddress.toHexString()]);
  if (vaultAddress.equals(constants.NULL.TYPE_ADDRESS)) return;

  updateStakedOutputTokenAmount(vaultAddress, gaugeAddress, event.block);
  updateFactoryRewards(vaultAddress, gaugeAddress, event.block);
  updateVaultSnapshots(vaultAddress, event.block);
}

export function handleWithdrawn(event: Withdrawn): void {
  const gaugeAddress = event.address;
  if (gaugeAddress.equals(constants.NULL.TYPE_ADDRESS)) return;

  const liquidityGauge = getOrCreateLiquidityGauge(gaugeAddress);

  const vaultAddress = Address.fromString(liquidityGauge.vault);
  log.warning("[Withdrawn] VaultAddress {}", [vaultAddress.toHexString()]);
  if (vaultAddress.equals(constants.NULL.TYPE_ADDRESS)) return;

  updateStakedOutputTokenAmount(vaultAddress, gaugeAddress, event.block);
  updateFactoryRewards(vaultAddress, gaugeAddress, event.block);
  updateVaultSnapshots(vaultAddress, event.block);
}

export function handleRewardPaid(event: RewardPaid): void {
  const gaugeAddress = event.address;
  if (gaugeAddress.equals(constants.NULL.TYPE_ADDRESS)) return;
}