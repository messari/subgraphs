import { Address } from "@graphprotocol/graph-ts";
import { LiquidityGauge as LiquidityGaugeTemplate } from "../../../generated/templates";
import { AddGauge } from "../../../generated/GaugeRegistry/GaugeRegistry";
import {
  Deposit,
  Withdraw,
  RewardDataUpdate,
  LiquidityGaugeV4 as GaugeContract,
} from "../../../generated/templates/LiquidityGauge/LiquidityGaugeV4";
import {
  getOrCreateLiquidityGauge,
  updateRewardToken,
  updateRewardEmission,
} from "../helpers/liquidityGauge";
import { getOrCreateVault, updateVaultSnapshots } from "../helpers/vaults";

export function handleAddGauge(event: AddGauge): void {
  const gaugeAddress = event.params.gauge;
  const vaultAddress = event.params.vault;
  const gauge = getOrCreateLiquidityGauge(gaugeAddress);
  gauge.vault = vaultAddress.toHex();
  gauge.save();

  // Liquidity gauge sets the first reward token to SPICE in constructor
  const gaugeContract = GaugeContract.bind(gaugeAddress);
  const rewardTokenAddress = gaugeContract.SPICE();
  updateRewardToken(
    gaugeAddress,
    vaultAddress,
    rewardTokenAddress,
    event.block
  );

  LiquidityGaugeTemplate.create(gaugeAddress);
}

export function handleDeposit(event: Deposit): void {
  // update amount of tokens staked
  const gauge = getOrCreateLiquidityGauge(event.address);
  const vaultAddress = Address.fromString(gauge.vault);
  const vault = getOrCreateVault(vaultAddress, event.block);
  vault.stakedOutputTokenAmount = vault.stakedOutputTokenAmount!.plus(
    event.params.value
  );
  vault.save();

  updateVaultSnapshots(vaultAddress, event.block);
}

export function handleWithdraw(event: Withdraw): void {
  // update amount of tokens staked
  const gauge = getOrCreateLiquidityGauge(event.address);
  const vaultAddress = Address.fromString(gauge.vault);
  const vault = getOrCreateVault(vaultAddress, event.block);
  vault.stakedOutputTokenAmount = vault.stakedOutputTokenAmount!.minus(
    event.params.value
  );
  vault.save();

  updateVaultSnapshots(vaultAddress, event.block);
}

export function handleRewardDataUpdate(event: RewardDataUpdate): void {
  // Track which tokens are being added to the vault
  const gaugeAddress = event.address;
  const rewardTokenAddress = event.params._token;

  const gauge = getOrCreateLiquidityGauge(gaugeAddress);
  const vaultAddress = Address.fromString(gauge.vault);

  updateRewardToken(
    gaugeAddress,
    vaultAddress,
    rewardTokenAddress,
    event.block
  );
  // Update vaults with new reward emissions
  updateRewardEmission(
    gaugeAddress,
    vaultAddress,
    rewardTokenAddress,
    event.block
  );
}
