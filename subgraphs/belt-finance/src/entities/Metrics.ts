import { Address, ethereum } from "@graphprotocol/graph-ts";
import {
  FinancialsDailySnapshot,
  UsageMetricsDailySnapshot,
  UsageMetricsHourlySnapshot,
  VaultDailySnapshot,
  VaultHourlySnapshot,
} from "../../generated/schema";
import { BIGDECIMAL_ZERO, BIGINT_ZERO } from "../constant";
import { getDay, getHour } from "../utils/numbers";
import { getOrCreateProtocol } from "./Protocol";

export function getOrCreateUsageMetricDailySnapshot(block: ethereum.Block): UsageMetricsDailySnapshot {
  let day = getDay(block.timestamp).toString();
  let snapshot = UsageMetricsDailySnapshot.load(day);

  if (snapshot) {
    return snapshot;
  }

  snapshot = new UsageMetricsDailySnapshot(day);

  snapshot.protocol = getOrCreateProtocol().id;
  snapshot.dailyActiveUsers = 0;
  snapshot.cumulativeUniqueUsers = 0;
  snapshot.dailyTransactionCount = 0;
  snapshot.dailyDepositCount = 0;
  snapshot.dailyWithdrawCount = 0;
  snapshot.blockNumber = block.number;
  snapshot.timestamp = block.timestamp;
  snapshot.save();

  return snapshot;
}

export function getOrCreateHourlyDailySnapshot(block: ethereum.Block): UsageMetricsHourlySnapshot {
  let hour = getHour(block.timestamp).toString();
  let id = hour.toString();

  let snapshot = UsageMetricsHourlySnapshot.load(id);

  if (snapshot) {
    return snapshot;
  }

  snapshot = new UsageMetricsHourlySnapshot(id);

  snapshot.protocol = getOrCreateProtocol().id;
  snapshot.hourlyActiveUsers = 0;
  snapshot.cumulativeUniqueUsers = 0;
  snapshot.hourlyTransactionCount = 0;
  snapshot.hourlyDepositCount = 0;
  snapshot.hourlyWithdrawCount = 0;
  snapshot.blockNumber = block.number;
  snapshot.timestamp = block.timestamp;
  snapshot.save();

  return snapshot;
}

export function getOrCreateFinancialsDailySnapshot(block: ethereum.Block): FinancialsDailySnapshot {
  let day = getDay(block.timestamp).toString();
  let snapshot = FinancialsDailySnapshot.load(day.toString());

  if (snapshot) {
    return snapshot;
  }

  snapshot = new FinancialsDailySnapshot(day.toString());

  snapshot.protocol = getOrCreateProtocol().id;
  snapshot.totalValueLockedUSD = BIGDECIMAL_ZERO;
  snapshot.dailySupplySideRevenueUSD = BIGDECIMAL_ZERO;
  snapshot.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
  snapshot.dailyProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
  snapshot.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
  snapshot.dailyTotalRevenueUSD = BIGDECIMAL_ZERO;
  snapshot.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;
  snapshot.blockNumber = block.number;
  snapshot.timestamp = block.timestamp;
  snapshot.save();

  return snapshot;
}

export function getOrCreateVaultDailySnapshot(vault: Address, block: ethereum.Block): VaultDailySnapshot {
  let day = getDay(block.timestamp).toString();
  const id = vault
    .toHex()
    .concat("-")
    .concat(day.toString());
  let snapshot = VaultDailySnapshot.load(id);

  if (snapshot) {
    return snapshot;
  }

  snapshot = new VaultDailySnapshot(id);

  snapshot.protocol = getOrCreateProtocol().id;
  snapshot.vault = vault.toHex().toLowerCase();
  snapshot.totalValueLockedUSD = BIGDECIMAL_ZERO;
  snapshot.inputTokenBalance = BIGINT_ZERO;
  snapshot.outputTokenSupply = BIGINT_ZERO;
  snapshot.outputTokenPriceUSD = BIGDECIMAL_ZERO;
  snapshot.pricePerShare = BIGDECIMAL_ZERO;
  snapshot.rewardTokenEmissionsAmount = [];
  snapshot.rewardTokenEmissionsUSD = [];
  snapshot.blockNumber = block.number;
  snapshot.timestamp = block.timestamp;
  snapshot.save();

  return snapshot;
}

export function getOrCreateVaultHourlySnapshot(vault: Address, block: ethereum.Block): VaultHourlySnapshot {
  let day = getDay(block.timestamp).toString();
  const id = vault
    .toHex()
    .concat("-")
    .concat(day.toString());
  let snapshot = VaultHourlySnapshot.load(id);

  if (snapshot) {
    return snapshot;
  }

  snapshot = new VaultHourlySnapshot(id);

  snapshot.protocol = getOrCreateProtocol().id;
  snapshot.vault = vault.toHex().toLowerCase();
  snapshot.totalValueLockedUSD = BIGDECIMAL_ZERO;
  snapshot.inputTokenBalance = BIGINT_ZERO;
  snapshot.outputTokenSupply = BIGINT_ZERO;
  snapshot.outputTokenPriceUSD = BIGDECIMAL_ZERO;
  snapshot.pricePerShare = BIGDECIMAL_ZERO;
  snapshot.rewardTokenEmissionsAmount = [];
  snapshot.rewardTokenEmissionsUSD = [];
  snapshot.blockNumber = block.number;
  snapshot.timestamp = block.timestamp;
  snapshot.save();

  return snapshot;
}
