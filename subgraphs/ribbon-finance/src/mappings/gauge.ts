import {
  updateRbnRewardsInfo,
  updateStakedOutputTokenAmount,
} from "../modules/Rewards";
import {
  Deposit,
  Withdraw,
} from "../../generated/rAAVEThetaGauge/LiquidityGaugeV5";
import * as constants from "../common/constants";
import { Address, log } from "@graphprotocol/graph-ts";
import { updateVaultSnapshots } from "../modules/Metrics";
import { getOrCreateLiquidityGauge } from "../common/initializers";

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
