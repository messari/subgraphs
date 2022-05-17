import {
  UsageMetricsDailySnapshot,
  UsageMetricsHourlySnapshot,
  FinancialsDailySnapshot,
  VaultDailySnapshot,
  VaultHourlySnapshot,
} from "../generated/schema";
import { Address, BigDecimal, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { getDay, getHour } from "./utils";
import { getOrCreateYieldAggregator, getOrCreateVault } from "./entities";

export function getOrCreateUsageMetricsDailySnapshot(
  eventId: number,
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
    object.dailyDepositCount = 1;
    object.dailyWithdrawCount = 1;
  } else {
    object.dailyActiveUsers += 1;
    object.dailyTransactionCount += 1;
  }

  object.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers;
  object.blockNumber = call.block.number;
  object.timestamp = call.block.timestamp;
  
  if (eventId === 1) {
    object.dailyWithdrawCount += 1;
  }

  if (eventId === 2) {
    object.dailyDepositCount += 1;
  }

  object.save();

  return object;
}

export function getOrCreateUsageMetricsHourlySnapshot(
  eventId: number,
  call: ethereum.Call
): UsageMetricsHourlySnapshot {
  const day = getDay(call.block.timestamp);
  const hour = getHour(call.block.timestamp);
  const id = `${hour}`;
  const protocol = getOrCreateYieldAggregator();
  let object = UsageMetricsHourlySnapshot.load(id);

  if (!object) {
    object = new UsageMetricsHourlySnapshot(id);

    object.protocol = protocol.id;
    object.hourlyActiveUsers = 1;
    object.hourlyTransactionCount = 1;
    object.hourlyDepositCount = 1;
    object.hourlyWithdrawCount = 1;
  } else {
    object.hourlyActiveUsers += 1;
    object.hourlyTransactionCount += 1;
  }

  object.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers;
  object.blockNumber = call.block.number;
  object.timestamp = call.block.timestamp;
  
  if (eventId === 1) {
    object.hourlyWithdrawCount += 1;
  }

  if (eventId === 2) {
    object.hourlyDepositCount += 1;
  }
  
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
  object.blockNumber = call.block.number;
  object.timestamp = call.block.timestamp;

  object.dailyProtocolSideRevenueUSD = object.dailyProtocolSideRevenueUSD.plus(
    protocolRevenueUsd
  );
  object.dailySupplySideRevenueUSD = object.dailySupplySideRevenueUSD.plus(
    supplySideRevenueUsd
  );

  protocol.cumulativeSupplySideRevenueUSD = protocol.cumulativeSupplySideRevenueUSD.plus(
    supplySideRevenueUsd
  );
  protocol.cumulativeProtocolSideRevenueUSD = protocol.cumulativeProtocolSideRevenueUSD.plus(
    protocolRevenueUsd
  );
  protocol.cumulativeTotalRevenueUSD = protocol.cumulativeTotalRevenueUSD
    .plus(supplySideRevenueUsd)
    .plus(protocolRevenueUsd);

  protocol.save();

  object.cumulativeSupplySideRevenueUSD = protocol.cumulativeSupplySideRevenueUSD;
  object.cumulativeProtocolSideRevenueUSD = protocol.cumulativeProtocolSideRevenueUSD;
  object.cumulativeTotalRevenueUSD = protocol.cumulativeTotalRevenueUSD; 
  
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

export function getOrCreateVaultHourlySnapshot(
  call: ethereum.Call,
  vaultAddress: Address
): VaultHourlySnapshot {
  const day = getDay(call.block.timestamp);
  const hour = getHour(call.block.timestamp);
  const id = `${vaultAddress.toHexString()}-${hour}`;
  const protocol = getOrCreateYieldAggregator();
  const vault = getOrCreateVault(
    vaultAddress,
    call.block.number,
    call.block.timestamp,
    false
  );
  let object = VaultHourlySnapshot.load(id);

  if (!object) {
    object = new VaultHourlySnapshot(id);
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
  eventId: number,
  call: ethereum.Call,
  vaultAddress: Address,
  protocolRevenueUsd: BigDecimal = BigDecimal.zero(),
  supplySideRevenueUsd: BigDecimal = BigDecimal.zero()
): void {
  getOrCreateUsageMetricsDailySnapshot(eventId, call);
  getOrCreateUsageMetricsHourlySnapshot(eventId, call);
  getOrCreateFinancialsDailySnapshot(
    call,
    protocolRevenueUsd,
    supplySideRevenueUsd
  );
  getOrCreateVaultDailySnapshot(call, vaultAddress);
  getOrCreateVaultHourlySnapshot(call, vaultAddress);
}
