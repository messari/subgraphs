import { Address, BigDecimal, BigInt } from '@graphprotocol/graph-ts';
import {
  FinancialsDailySnapshot,
  UsageMetricsDailySnapshot,
  VaultDailySnapshot,
} from '../../generated/schema';

export function getOrCreateUserSnapshot(day: i32): UsageMetricsDailySnapshot {
  let snapshot = UsageMetricsDailySnapshot.load(day.toString());

  if (snapshot) {
    return snapshot;
  }

  snapshot = new UsageMetricsDailySnapshot(day.toString());

  snapshot.protocol = '';
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

  snapshot.protocol = '';
  snapshot.totalValueLockedUSD = BigDecimal.zero();
  snapshot.protocolTreasuryUSD = BigDecimal.zero();
  snapshot.protocolControlledValueUSD = BigDecimal.zero();
  snapshot.totalVolumeUSD = BigDecimal.zero();
  snapshot.supplySideRevenueUSD = BigDecimal.zero();
  snapshot.protocolSideRevenueUSD = BigDecimal.zero();
  snapshot.feesUSD = BigDecimal.zero();
  snapshot.blockNumber = BigInt.fromI32(0);
  snapshot.timestamp = BigInt.fromI32(0);
  snapshot.save();

  return snapshot;
}

export function getOrCreateVaultDailySnapshot(
  vault: Address,
  day: i32,
): VaultDailySnapshot {
  const id = vault
    .toHex()
    .concat('-')
    .concat(day.toString());
  let snapshot = VaultDailySnapshot.load(id);

  if (snapshot) {
    return snapshot;
  }

  snapshot = new VaultDailySnapshot(id);

  snapshot.protocol = '';
  snapshot.vault = vault.toHex();
  snapshot.totalValueLockedUSD = BigDecimal.zero();
  snapshot.totalVolumeUSD = BigDecimal.zero();
  snapshot.inputTokenBalances = BigInt.zero();
  snapshot.outputTokenSupply = BigInt.zero();
  snapshot.outputTokenPriceUSD = BigDecimal.zero();
  snapshot.rewardTokenEmissionsAmount = [];
  snapshot.rewardTokenEmissionsUSD = [];
  snapshot.blockNumber = BigInt.fromI32(0);
  snapshot.timestamp = BigInt.fromI32(0);
  snapshot.save();

  return snapshot;
}
