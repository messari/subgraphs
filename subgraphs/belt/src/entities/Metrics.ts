import { Address, ethereum } from "@graphprotocol/graph-ts";
import { FinancialsDailySnapshot, UsageMetricsDailySnapshot, VaultDailySnapshot } from "../../generated/schema";
import { BIGDECIMAL_ZERO, BIGINT_ZERO } from "../constant";
import { getDay } from "../utils/numbers";
import { getOrCreateProtocol } from "./Protocol";

export function getOrCreateUsageMetricSnapshot(block: ethereum.Block): UsageMetricsDailySnapshot {
  let day = getDay(block.timestamp).toString();
  let snapshot = UsageMetricsDailySnapshot.load(day);

  if (snapshot) {
    return snapshot;
  }

  snapshot = new UsageMetricsDailySnapshot(day);

  snapshot.protocol = getOrCreateProtocol().id;
  snapshot.activeUsers = 0;
  snapshot.totalUniqueUsers = 0;
  snapshot.dailyTransactionCount = 0;
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
  snapshot.totalVolumeUSD = BIGDECIMAL_ZERO;
  snapshot.supplySideRevenueUSD = BIGDECIMAL_ZERO;
  snapshot.protocolSideRevenueUSD = BIGDECIMAL_ZERO;
  snapshot.totalRevenueUSD = BIGDECIMAL_ZERO;
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
  snapshot.vault = vault.toHex();
  snapshot.totalValueLockedUSD = BIGDECIMAL_ZERO;
  snapshot.totalVolumeUSD = BIGDECIMAL_ZERO;
  snapshot.inputTokenBalances = [];
  snapshot.outputTokenSupply = BIGINT_ZERO;
  snapshot.outputTokenPriceUSD = BIGDECIMAL_ZERO;
  snapshot.rewardTokenEmissionsAmount = [];
  snapshot.rewardTokenEmissionsUSD = [];
  snapshot.blockNumber = block.number;
  snapshot.timestamp = block.timestamp;
  snapshot.save();

  return snapshot;
}
