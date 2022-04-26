import {
  UsageMetricsDailySnapshot,
  FinancialsDailySnapshot,
  VaultDailySnapshot,
} from "../generated/schema";
import { Address, BigDecimal, ethereum } from "@graphprotocol/graph-ts";
import { getDay } from "./utils";
import { getOrCreateYieldAggregator, getOrCreateVault } from "./entities";

export function getOrCreateUsageMetricsDailySnapshot(
  call: ethereum.Call
): UsageMetricsDailySnapshot {
  const day = getDay(call.block.timestamp);
  const protocol = getOrCreateYieldAggregator();
  let object = UsageMetricsDailySnapshot.load(day.toString());

  if (!object) {
    object = new UsageMetricsDailySnapshot(day.toString());

    object.protocol = protocol.id;
    object.activeUsers = 1;
    object.dailyTransactionCount = 1;
  } else {
    object.activeUsers += 1;
    object.dailyTransactionCount += 1;
  }

  object.totalUniqueUsers = protocol.totalUniqueUsers;
  object.blockNumber = call.block.number;
  object.timestamp = call.block.timestamp;

  object.save();

  return object;
}

export function getOrCreateFinancialsDailySnapshot(
  call: ethereum.Call
): FinancialsDailySnapshot {
  const day = getDay(call.block.timestamp);
  const protocol = getOrCreateYieldAggregator();
  let object = FinancialsDailySnapshot.load(day.toString());

  if (!object) {
    object = new FinancialsDailySnapshot(day.toString());
    object.protocol = protocol.id;
  }

  object.totalVolumeUSD = protocol.totalVolumeUSD;
  object.totalValueLockedUSD = protocol.totalValueLockedUSD;
  object.totalRevenueUSD = protocol.totalValueLockedUSD;
  object.supplySideRevenueUSD = BigDecimal.zero();
  object.protocolSideRevenueUSD = BigDecimal.zero();
  object.blockNumber = call.block.number;
  object.timestamp = call.block.timestamp;

  object.save();

  return object;
}

export function getOrCreateVaultDailySnapshot(
  call: ethereum.Call,
  vaultAddress: Address
): VaultDailySnapshot {
  const day = getDay(call.block.timestamp);
  const id = `${vaultAddress.toHexString()}-${day}`;
  const protocol = getOrCreateYieldAggregator();
  const vault = getOrCreateVault(
    vaultAddress,
    call.block.number,
    call.block.timestamp,
    false
  );
  let object = VaultDailySnapshot.load(id);

  if (!object) {
    object = new VaultDailySnapshot(id);
    object.protocol = protocol.id;
    object.vault = vault.id;
  }

  object.totalValueLockedUSD = vault.totalValueLockedUSD;
  object.totalVolumeUSD = vault.totalVolumeUSD;
  object.inputTokenBalances = vault.inputTokenBalances;
  object.outputTokenSupply = vault.outputTokenSupply;
  object.outputTokenPriceUSD = vault.outputTokenPriceUSD;
  object.rewardTokenEmissionsAmount = vault.rewardTokenEmissionsAmount;
  object.rewardTokenEmissionsUSD = vault.rewardTokenEmissionsUSD;
  object.blockNumber = call.block.number;
  object.timestamp = call.block.timestamp;
  object.pricePerShare = vault.pricePerShare;

  object.save();

  return object;
}

export function updateAllSnapshots(
  call: ethereum.Call,
  vaultAddress: Address
): void {
  getOrCreateUsageMetricsDailySnapshot(call);
  getOrCreateFinancialsDailySnapshot(call);
  getOrCreateVaultDailySnapshot(call, vaultAddress);
}
