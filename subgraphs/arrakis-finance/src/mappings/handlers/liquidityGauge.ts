import { Address, BigInt, log, store } from "@graphprotocol/graph-ts";
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
  removeRewardToken,
  updateRewardEmissions,
  addRewardToken,
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

  addRewardToken(spiceResult.value, RewardTokenType.DEPOSIT, vault);
  updateVaultSnapshots(vault, event.block);
}

export function handleRemoveGauge(event: RemoveGauge): void {
  const gaugeAddress = event.params.gauge;
  const vaultAddress = event.params.vault;
  const gauge = getOrCreateLiquidityGauge(gaugeAddress);
  store.remove("_LiquidityGauge", gauge.id);
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
  const rewardCountResult = gaugeContract.try_reward_count();
  if (rewardCountResult.reverted) {
    log.error(
      "[handleRemoveGauge]reward_count() call for gauge {} reverted tx {}-{}",
      [
        gaugeAddress.toHexString(),
        event.transaction.hash.toHexString(),
        event.transactionLogIndex.toString(),
      ]
    );
    return;
  }

  for (let i = 0; i < rewardCountResult.value.toI32(); i++) {
    const rewardTokenResult = gaugeContract.try_reward_tokens(
      BigInt.fromI32(i)
    );
    if (rewardCountResult.reverted) {
      log.error(
        "[handleRemoveGauge]reward_tokens(i) call for gauge {} reverted tx {}-{}",
        [
          i.toString(),
          gaugeAddress.toHexString(),
          event.transaction.hash.toHexString(),
          event.transactionLogIndex.toString(),
        ]
      );
      continue;
    }
    const rewardToken = getOrCreateRewardToken(
      rewardTokenResult.value,
      RewardTokenType.DEPOSIT
    );
    removeRewardToken(rewardToken.id, vault);
  }

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

  updateRewardEmissions(vault, event.address, event);
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

  updateRewardEmissions(vault, event.address, event);
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

  addRewardToken(rewardTokenAddress, RewardTokenType.DEPOSIT, vault);
  // Update vaults with new reward emissions
  updateRewardEmissions(vault, gaugeAddress, event);
  updateVaultSnapshots(vault, event.block);
}
