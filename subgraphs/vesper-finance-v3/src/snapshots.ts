import {
  UsageMetricsDailySnapshot,
  FinancialsDailySnapshot,
  VaultDailySnapshot,
} from "../generated/schema";
import { Address, BigDecimal, BigInt, ethereum } from "@graphprotocol/graph-ts";
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
    object.dailyActiveUsers = 1;
    object.dailyTransactionCount = 1;
  } else {
    object.dailyActiveUsers += 1;
    object.dailyTransactionCount += 1;
  }
  
  object.blockNumber = call.block.number;
  object.timestamp = call.block.timestamp;

  object.save();

  return object;
}

export function getOrCreateFinancialsDailySnapshot(
  call: ethereum.Call,
  protocolRevenueUsd: BigDecimal = BigDecimal.zero(),
  supplySideRevenueUsd: BigDecimal = BigDecimal.zero()
): FinancialsDailySnapshot {
  const day = getDay(call.block.timestamp);
  const protocol = getOrCreateYieldAggregator();
  let object = FinancialsDailySnapshot.load(day.toString());

  if (!object) {
    object = new FinancialsDailySnapshot(day.toString());
    object.protocol = protocol.id;
  }

  object.totalValueLockedUSD = protocol.totalValueLockedUSD;
  object.totalValueLockedUSD = protocol.totalValueLockedUSD;
  object.dailyProtocolSideRevenueUSD = object.dailyProtocolSideRevenueUSD.plus(protocolRevenueUsd);
  object.dailySupplySideRevenueUSD = object.dailySupplySideRevenueUSD.plus(supplySideRevenueUsd);
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
  object.inputTokenBalance = vault.inputTokenBalance;
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
  vaultAddress: Address,
  protocolRevenueUsd: BigDecimal = BigDecimal.zero(),
  supplySideRevenueUsd: BigDecimal = BigDecimal.zero()
): void {
  getOrCreateUsageMetricsDailySnapshot(call);
  getOrCreateFinancialsDailySnapshot(
    call,
    protocolRevenueUsd,
    supplySideRevenueUsd
  );
  getOrCreateVaultDailySnapshot(call, vaultAddress);
}
