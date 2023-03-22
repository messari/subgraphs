import { Address, log } from "@graphprotocol/graph-ts";
import { LiquidityGauge as LiquidityGaugeTemplate } from "../../../generated/templates";
import {
  AddGauge,
  RemoveGauge,
} from "../../../generated/GaugeRegistry/GaugeRegistry";
import {
  Deposit,
  Withdraw,
  RewardDataUpdate,
  LiquidityGaugeV4 as GaugeContract,
} from "../../../generated/templates/LiquidityGauge/LiquidityGaugeV4";
import {
  getOrCreateLiquidityGauge,
  updateRewardEmission,
  updateRewardTokens,
} from "../helpers/liquidityGauge";
import { getOrCreateVault, updateVaultSnapshots } from "../helpers/vaults";
import { Vault } from "../../../generated/schema";
import { RewardTokenType } from "../../common/constants";
import { getOrCreateRewardToken } from "../../common/getters";

export function handleAddGauge(event: AddGauge): void {
  const gaugeAddress = event.params.gauge;
  LiquidityGaugeTemplate.create(gaugeAddress);

  const vaultAddress = event.params.vault;
  const gauge = getOrCreateLiquidityGauge(gaugeAddress);
  gauge.vault = vaultAddress.toHexString();
  gauge.save();

  const vault = Vault.load(vaultAddress.toHexString());
  if (!vault) {
    log.error("[handleAddGauge]vault {} doesn't exist tx {}-{}", [
      vaultAddress.toHexString(),
      event.transaction.hash.toHexString(),
      event.transactionLogIndex.toString(),
    ]);
    return;
  }

  // Liquidity gauge sets the first reward token to SPICE in constructor
  const gaugeContract = GaugeContract.bind(gaugeAddress);
  const spiceResult = gaugeContract.try_SPICE();
  if (spiceResult.reverted) {
    log.error(
      "[handleAddGauge]gauge.SPICE() call for gauge {} reverted tx {}-{}",
      [
        gaugeAddress.toHexString(),
        event.transaction.hash.toHexString(),
        event.transactionLogIndex.toString(),
      ]
    );
    return;
  }

  updateRewardTokens(spiceResult.value, vault);
  updateVaultSnapshots(vault, event.block);
}

export function handleRemoveGauge(event: RemoveGauge): void {
  const gaugeAddress = event.params.gauge;
  const vaultAddress = event.params.vault;
  const gauge = getOrCreateLiquidityGauge(gaugeAddress);
  gauge.vault = Address.zero().toHexString();
  gauge.save();

  const vault = Vault.load(vaultAddress.toHexString());
  if (!vault) {
    log.error("[handleRemoveGauge]vault {} doesn't exist tx {}-{}", [
      vaultAddress.toHexString(),
      event.transaction.hash.toHexString(),
      event.transactionLogIndex.toString(),
    ]);
    return;
  }

  // remove reward token from vault.rewardTokens
  const gaugeContract = GaugeContract.bind(gaugeAddress);
  const spiceResult = gaugeContract.try_SPICE();
  if (spiceResult.reverted) {
    log.error(
      "[handleRemoveGauge]gauge.SPICE() call for gauge {} reverted tx {}-{}",
      [
        gaugeAddress.toHexString(),
        event.transaction.hash.toHexString(),
        event.transactionLogIndex.toString(),
      ]
    );
    return;
  }
  const rewardToken = getOrCreateRewardToken(
    spiceResult.value,
    RewardTokenType.DEPOSIT
  );

  const rewardTokens = vault.rewardTokens;
  if (!rewardTokens || rewardTokens.length == 0) {
    return;
  }
  const rewardEmission = vault.rewardTokenEmissionsAmount;
  const rewardEmissionUSD = vault.rewardTokenEmissionsUSD;
  const index = rewardTokens.indexOf(rewardToken.id);
  if (index != -1) {
    rewardTokens.splice(index, 1);
    rewardEmission!.splice(index, 1);
    rewardEmissionUSD!.splice(index, 1);
  }
  vault.rewardTokens = rewardTokens;
  vault.rewardTokenEmissionsAmount = rewardEmission;
  vault.rewardTokenEmissionsUSD = rewardEmissionUSD;
  vault.save();

  updateVaultSnapshots(vault, event.block);
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

  updateVaultSnapshots(vault, event.block);
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

  updateVaultSnapshots(vault, event.block);
}

export function handleRewardDataUpdate(event: RewardDataUpdate): void {
  // Track which tokens are being added to the vault
  const gaugeAddress = event.address;
  const rewardTokenAddress = event.params._token;

  const gauge = getOrCreateLiquidityGauge(gaugeAddress);
  const vaultAddress = Address.fromString(gauge.vault);
  const vault = Vault.load(vaultAddress.toHexString());
  if (!vault) {
    log.error("[handleRewardDataUpdate]vault {} doesn't exist tx {}-{}", [
      vaultAddress.toHexString(),
      event.transaction.hash.toHexString(),
      event.transactionLogIndex.toString(),
    ]);
    return;
  }

  updateRewardTokens(rewardTokenAddress, vault);
  // Update vaults with new reward emissions
  updateRewardEmission(gaugeAddress, vaultAddress, rewardTokenAddress, event);
  updateVaultSnapshots(vault, event.block);
}
