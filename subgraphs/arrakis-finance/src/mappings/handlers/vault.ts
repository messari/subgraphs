import { BigInt } from "@graphprotocol/graph-ts";
import { PoolCreated } from "../../../generated/ArrakisFactory/ArrakisFactoryV1";
import { ArrakisVault as ArrakisVaultTemplate } from "../../../generated/templates";
import {
  Burned,
  FeesEarned,
  Minted,
  UpdateManagerParams,
} from "../../../generated/templates/ArrakisVault/ArrakisVaultV1";
import { InitializeCall } from "../../../generated/templates/LiquidityGauge/LiquidityGaugeV4";
import {
  PROTOCOL_PERFORMANCE_FEE,
  UsageType,
  VaultFeeType,
} from "../../common/constants";
import { getOrCreateYieldAggregator } from "../../common/getters";
import {
  createDeposit,
  createFeesEarned,
  createWithdraw,
} from "../helpers/events";
import { updateRevenue, updateTvl } from "../helpers/financials";
import { updateUsageMetrics } from "../helpers/usageMetrics";
import {
  getOrCreateVault,
  getOrCreateVaultFee,
  updateVaultSnapshots,
} from "../helpers/vaults";

export function handlePoolCreated(event: PoolCreated): void {
  let protocol = getOrCreateYieldAggregator(event.address);
  protocol.totalPoolCount += 1;
  protocol.save();
  // Create Vault
  let vault = getOrCreateVault(event.params.pool, event.block);
  vault.protocol = event.address.toHex();
  vault.save();

  ArrakisVaultTemplate.create(event.params.pool);
}

export function handleMinted(event: Minted): void {
  // Create deposit event
  createDeposit(event);

  // Update vault token supply
  let vault = getOrCreateVault(event.address, event.block);
  vault.inputTokenBalance += event.params.mintAmount;
  vault.outputTokenSupply += event.params.mintAmount;
  vault.save();

  updateUsageMetrics(event.params.receiver, UsageType.DEPOSIT, event); // minted shares are attributed to receiver
  updateTvl(event);
  updateVaultSnapshots(event.address, event.block);
}

export function handleBurned(event: Burned): void {
  // Create withdraw event
  createWithdraw(event);

  // Update vault token supply
  let vault = getOrCreateVault(event.address, event.block);
  vault.inputTokenBalance -= event.params.burnAmount;
  vault.outputTokenSupply -= event.params.burnAmount;
  vault.save();

  updateUsageMetrics(event.transaction.from, UsageType.WITHDRAW, event); // Burned shares are attributed to msg.sender
  updateTvl(event);
  updateVaultSnapshots(event.address, event.block);
}

export function handleFeesEarned(event: FeesEarned): void {
  createFeesEarned(event);
  updateRevenue(event);
  updateTvl(event);
  updateVaultSnapshots(event.address, event.block);
}

export function handleUpdateManagerParams(event: UpdateManagerParams): void {
  let vaultPerformanceFee = getOrCreateVaultFee(
    VaultFeeType.PERFORMANCE_FEE,
    event.address.toHex()
  );
  const managerFee = BigInt.fromI32(
    event.params.managerFeeBPS / 100
  ).toBigDecimal();
  vaultPerformanceFee.feePercentage = PROTOCOL_PERFORMANCE_FEE.plus(managerFee);
  vaultPerformanceFee.save();
}
