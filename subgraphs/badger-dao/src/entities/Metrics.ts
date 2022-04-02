import { Address, BigInt } from "@graphprotocol/graph-ts";
import { FinancialsDailySnapshot, UsageMetricsDailySnapshot, VaultDailySnapshot } from "../../generated/schema";
import { BIGDECIMAL_ZERO, BIGINT_ZERO } from "../constant";
import { getOrCreateProtocol } from "./Protocol";

export function getOrCreateUserSnapshot(day: i32): UsageMetricsDailySnapshot {
  let snapshot = UsageMetricsDailySnapshot.load(day.toString());

  if (snapshot) {
    return snapshot;
  }

  snapshot = new UsageMetricsDailySnapshot(day.toString());

  snapshot.protocol = getOrCreateProtocol().id;
  snapshot.activeUsers = 0;
  snapshot.totalUniqueUsers = 0;
  snapshot.dailyTransactionCount = 0;
  snapshot.blockNumber = BigInt.fromI32(0);
  snapshot.timestamp = BigInt.fromI32(0);
  snapshot.save();

  return snapshot;
}

export function getOrCreateFinancialsDailySnapshot(day: i32): FinancialsDailySnapshot {
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
  snapshot.feesUSD = BIGDECIMAL_ZERO;
  snapshot.blockNumber = BigInt.fromI32(0);
  snapshot.timestamp = BigInt.fromI32(0);
  snapshot.save();

  return snapshot;
}

export function getOrCreateVaultDailySnapshot(vault: Address, day: i32): VaultDailySnapshot {
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
  snapshot.blockNumber = BigInt.fromI32(0);
  snapshot.timestamp = BigInt.fromI32(0);
  snapshot.save();

  return snapshot;
}
