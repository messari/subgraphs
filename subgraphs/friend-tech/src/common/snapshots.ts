import { BigInt, Bytes, ethereum } from "@graphprotocol/graph-ts";

import { SECONDS_PER_DAY, SECONDS_PER_HOUR } from "./constants";
import { getDaysSinceEpoch, getHoursSinceEpoch } from "./utils";
import { NetworkConfigs } from "../../configurations/configure";

import {
  FinancialsDailySnapshot,
  Pool,
  PoolDailySnapshot,
  PoolHourlySnapshot,
  Protocol,
  UsageMetricsDailySnapshot,
  UsageMetricsHourlySnapshot,
} from "../../generated/schema";

export function takeUsageMetricsDailySnapshot(
  protocol: Protocol,
  event: ethereum.Event
): void {
  const day = getDaysSinceEpoch(event.block.timestamp.toI32());
  const snapshot = new UsageMetricsDailySnapshot(Bytes.fromI32(day));

  snapshot.day = day;
  snapshot.protocol = protocol.id;
  snapshot.blockNumber = event.block.number;
  snapshot.timestamp = event.block.timestamp;

  snapshot.cumulativeUniqueBuyers = protocol.cumulativeUniqueBuyers;
  snapshot.cumulativeUniqueSellers = protocol.cumulativeUniqueSellers;
  snapshot.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers;
  snapshot.cumulativeBuyCount = protocol.cumulativeBuyCount;
  snapshot.cumulativeSellCount = protocol.cumulativeSellCount;
  snapshot.cumulativeTransactionCount = protocol.cumulativeTransactionCount;
  snapshot.totalPoolCount = protocol.totalPoolCount;

  let activeBuyersDelta = snapshot.cumulativeUniqueBuyers;
  let activeSellersDelta = snapshot.cumulativeUniqueSellers;
  let activeUsersDelta = snapshot.cumulativeUniqueUsers;
  let buyCountDelta = snapshot.cumulativeBuyCount;
  let sellCountDelta = snapshot.cumulativeSellCount;
  let transactionCountDelta = snapshot.cumulativeTransactionCount;

  const previousDay = getDaysSinceEpoch(
    protocol._lastDailySnapshotTimestamp!.toI32()
  );
  const previousSnapshot = UsageMetricsDailySnapshot.load(
    Bytes.fromI32(previousDay)
  );
  if (previousSnapshot) {
    activeBuyersDelta =
      snapshot.cumulativeUniqueBuyers - previousSnapshot.cumulativeUniqueBuyers;
    activeSellersDelta =
      snapshot.cumulativeUniqueSellers -
      previousSnapshot.cumulativeUniqueSellers;
    activeUsersDelta =
      snapshot.cumulativeUniqueUsers - previousSnapshot.cumulativeUniqueUsers;
    buyCountDelta =
      snapshot.cumulativeBuyCount - previousSnapshot.cumulativeBuyCount;
    sellCountDelta =
      snapshot.cumulativeSellCount - previousSnapshot.cumulativeSellCount;
    transactionCountDelta =
      snapshot.cumulativeTransactionCount -
      previousSnapshot.cumulativeTransactionCount;
  }
  snapshot.dailyActiveBuyers = activeBuyersDelta;
  snapshot.dailyActiveSellers = activeSellersDelta;
  snapshot.dailyActiveUsers = activeUsersDelta;
  snapshot.dailyBuyCount = buyCountDelta;
  snapshot.dailySellCount = sellCountDelta;
  snapshot.dailyTransactionCount = transactionCountDelta;

  snapshot.save();
}

export function takeUsageMetricsHourlySnapshot(
  protocol: Protocol,
  event: ethereum.Event
): void {
  const hour = getHoursSinceEpoch(event.block.timestamp.toI32());
  const snapshot = new UsageMetricsHourlySnapshot(Bytes.fromI32(hour));

  snapshot.hour = hour;
  snapshot.protocol = protocol.id;
  snapshot.blockNumber = event.block.number;
  snapshot.timestamp = event.block.timestamp;

  snapshot.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers;
  snapshot.cumulativeTransactionCount = protocol.cumulativeTransactionCount;

  let activeUsersDelta = snapshot.cumulativeUniqueUsers;
  let transactionCountDelta = snapshot.cumulativeTransactionCount;

  const previousHour = getHoursSinceEpoch(
    protocol._lastHourlySnapshotTimestamp!.toI32()
  );
  const previousSnapshot = UsageMetricsHourlySnapshot.load(
    Bytes.fromI32(previousHour)
  );
  if (previousSnapshot) {
    activeUsersDelta =
      snapshot.cumulativeUniqueUsers - previousSnapshot.cumulativeUniqueUsers;
    transactionCountDelta =
      snapshot.cumulativeTransactionCount -
      previousSnapshot.cumulativeTransactionCount;
  }
  snapshot.hourlyActiveUsers = activeUsersDelta;
  snapshot.hourlyTransactionCount = transactionCountDelta;

  snapshot.save();
}

export function takeFinancialsDailySnapshot(
  protocol: Protocol,
  event: ethereum.Event
): void {
  const day = getDaysSinceEpoch(event.block.timestamp.toI32());
  const snapshot = new FinancialsDailySnapshot(Bytes.fromI32(day));

  snapshot.day = day;
  snapshot.protocol = protocol.id;
  snapshot.blockNumber = event.block.number;
  snapshot.timestamp = event.block.timestamp;

  snapshot.totalValueLockedUSD = protocol.totalValueLockedUSD;
  snapshot.cumulativeSupplySideRevenueUSD =
    protocol.cumulativeSupplySideRevenueUSD;
  snapshot.cumulativeProtocolSideRevenueUSD =
    protocol.cumulativeProtocolSideRevenueUSD;
  snapshot.cumulativeTotalRevenueUSD = protocol.cumulativeTotalRevenueUSD;
  snapshot.cumulativeBuyVolumeUSD = protocol.cumulativeBuyVolumeUSD;
  snapshot.cumulativeSellVolumeUSD = protocol.cumulativeSellVolumeUSD;
  snapshot.cumulativeTotalVolumeUSD = protocol.cumulativeTotalVolumeUSD;
  snapshot.netVolumeUSD = protocol.netVolumeUSD;

  let supplySideRevenueUSDDelta = snapshot.cumulativeSupplySideRevenueUSD;
  let protocolSideRevenueUSDDelta = snapshot.cumulativeProtocolSideRevenueUSD;
  let totalRevenueUSDDelta = snapshot.cumulativeTotalRevenueUSD;
  let buyVolumeUSDDelta = snapshot.cumulativeBuyVolumeUSD;
  let sellVolumeUSDDelta = snapshot.cumulativeSellVolumeUSD;
  let totalVolumeUSDDelta = snapshot.cumulativeTotalVolumeUSD;
  let netVolumeUSDDelta = snapshot.netVolumeUSD;

  const previousDay = getDaysSinceEpoch(
    protocol._lastDailySnapshotTimestamp!.toI32()
  );
  const previousSnapshot = FinancialsDailySnapshot.load(
    Bytes.fromI32(previousDay)
  );
  if (previousSnapshot) {
    supplySideRevenueUSDDelta = snapshot.cumulativeSupplySideRevenueUSD.minus(
      previousSnapshot.cumulativeSupplySideRevenueUSD
    );
    protocolSideRevenueUSDDelta =
      snapshot.cumulativeProtocolSideRevenueUSD.minus(
        previousSnapshot.cumulativeProtocolSideRevenueUSD
      );
    totalRevenueUSDDelta = snapshot.cumulativeTotalRevenueUSD.minus(
      previousSnapshot.cumulativeTotalRevenueUSD
    );
    buyVolumeUSDDelta = snapshot.cumulativeBuyVolumeUSD.minus(
      previousSnapshot.cumulativeBuyVolumeUSD
    );
    sellVolumeUSDDelta = snapshot.cumulativeSellVolumeUSD.minus(
      previousSnapshot.cumulativeSellVolumeUSD
    );
    totalVolumeUSDDelta = snapshot.cumulativeTotalVolumeUSD.minus(
      previousSnapshot.cumulativeTotalVolumeUSD
    );
    netVolumeUSDDelta = snapshot.netVolumeUSD.minus(
      previousSnapshot.netVolumeUSD
    );
  }
  snapshot.dailySupplySideRevenueUSD = supplySideRevenueUSDDelta;
  snapshot.dailyProtocolSideRevenueUSD = protocolSideRevenueUSDDelta;
  snapshot.dailyTotalRevenueUSD = totalRevenueUSDDelta;
  snapshot.dailyBuyVolumeUSD = buyVolumeUSDDelta;
  snapshot.dailySellVolumeUSD = sellVolumeUSDDelta;
  snapshot.dailyTotalVolumeUSD = totalVolumeUSDDelta;
  snapshot.dailyNetVolumeUSD = netVolumeUSDDelta;

  snapshot.save();
}

export function takeProtocolSnapshots(
  protocol: Protocol,
  event: ethereum.Event
): void {
  if (
    protocol._lastDailySnapshotTimestamp
      .plus(BigInt.fromI32(SECONDS_PER_DAY))
      .lt(event.block.timestamp)
  ) {
    takeUsageMetricsDailySnapshot(protocol, event);
    takeFinancialsDailySnapshot(protocol, event);

    protocol._lastDailySnapshotTimestamp = event.block.timestamp;
    protocol.save();
  }
  if (
    protocol._lastHourlySnapshotTimestamp
      .plus(BigInt.fromI32(SECONDS_PER_HOUR))
      .lt(event.block.timestamp)
  ) {
    takeUsageMetricsHourlySnapshot(protocol, event);

    protocol._lastHourlySnapshotTimestamp = event.block.timestamp;
    protocol.save();
  }
}

export function takePoolDailySnapshot(pool: Pool, event: ethereum.Event): void {
  const day = getDaysSinceEpoch(event.block.timestamp.toI32());
  const id = Bytes.empty()
    .concat(pool.id)
    .concat(Bytes.fromUTF8("-"))
    .concat(Bytes.fromI32(day));
  const snapshot = new PoolDailySnapshot(id);

  snapshot.day = day;
  snapshot.pool = pool.id;
  snapshot.protocol = NetworkConfigs.getFactoryAddress();
  snapshot.blockNumber = event.block.number;
  snapshot.timestamp = event.block.timestamp;

  snapshot.totalValueLockedUSD = pool.totalValueLockedUSD;
  snapshot.inputTokenBalances = pool.inputTokenBalances;
  snapshot.inputTokenBalancesUSD = pool.inputTokenBalancesUSD;

  snapshot.cumulativeSupplySideRevenueUSD = pool.cumulativeSupplySideRevenueUSD;
  snapshot.cumulativeProtocolSideRevenueUSD =
    pool.cumulativeProtocolSideRevenueUSD;
  snapshot.cumulativeTotalRevenueUSD = pool.cumulativeTotalRevenueUSD;

  snapshot.cumulativeBuyVolumeAmount = pool.cumulativeBuyVolumeAmount;
  snapshot.cumulativeBuyVolumeUSD = pool.cumulativeBuyVolumeUSD;
  snapshot.cumulativeSellVolumeAmount = pool.cumulativeSellVolumeAmount;
  snapshot.cumulativeSellVolumeUSD = pool.cumulativeSellVolumeUSD;
  snapshot.cumulativeTotalVolumeAmount = pool.cumulativeTotalVolumeAmount;
  snapshot.cumulativeTotalVolumeUSD = pool.cumulativeTotalVolumeUSD;
  snapshot.netVolumeAmount = pool.netVolumeAmount;
  snapshot.netVolumeUSD = pool.netVolumeUSD;

  snapshot.cumulativeUniqueUsers = pool.cumulativeUniqueUsers;
  snapshot.cumulativeBuyCount = pool.cumulativeBuyCount;
  snapshot.cumulativeSellCount = pool.cumulativeSellCount;
  snapshot.cumulativeTransactionCount = pool.cumulativeTransactionCount;

  let supplySideRevenueUSDDelta = snapshot.cumulativeSupplySideRevenueUSD;
  let protocolSideRevenueUSDDelta = snapshot.cumulativeProtocolSideRevenueUSD;
  let totalRevenueUSDDelta = snapshot.cumulativeTotalRevenueUSD;
  let buyVolumeAmountDelta = snapshot.cumulativeBuyVolumeAmount;
  let buyVolumeUSDDelta = snapshot.cumulativeBuyVolumeUSD;
  let sellVolumeAmountDelta = snapshot.cumulativeSellVolumeAmount;
  let sellVolumeUSDDelta = snapshot.cumulativeSellVolumeUSD;
  let totalVolumeAmountDelta = snapshot.cumulativeTotalVolumeAmount;
  let totalVolumeUSDDelta = snapshot.cumulativeTotalVolumeUSD;
  let netVolumeAmountDelta = snapshot.netVolumeAmount;
  let netVolumeUSDDelta = snapshot.netVolumeUSD;
  let activeUsersDelta = snapshot.cumulativeUniqueUsers;
  let buyCountDelta = snapshot.cumulativeBuyCount;
  let sellCountDelta = snapshot.cumulativeSellCount;
  let transactionCountDelta = snapshot.cumulativeTransactionCount;

  const previousDay = getDaysSinceEpoch(
    pool._lastDailySnapshotTimestamp!.toI32()
  );
  const previousSnapshot = PoolDailySnapshot.load(Bytes.fromI32(previousDay));
  if (previousSnapshot) {
    supplySideRevenueUSDDelta = snapshot.cumulativeSupplySideRevenueUSD.minus(
      previousSnapshot.cumulativeSupplySideRevenueUSD
    );
    protocolSideRevenueUSDDelta =
      snapshot.cumulativeProtocolSideRevenueUSD.minus(
        previousSnapshot.cumulativeProtocolSideRevenueUSD
      );
    totalRevenueUSDDelta = snapshot.cumulativeTotalRevenueUSD.minus(
      previousSnapshot.cumulativeTotalRevenueUSD
    );
    buyVolumeUSDDelta = snapshot.cumulativeBuyVolumeUSD.minus(
      previousSnapshot.cumulativeBuyVolumeUSD
    );
    buyVolumeAmountDelta = snapshot.cumulativeBuyVolumeAmount.minus(
      previousSnapshot.cumulativeBuyVolumeAmount
    );
    sellVolumeUSDDelta = snapshot.cumulativeSellVolumeUSD.minus(
      previousSnapshot.cumulativeSellVolumeUSD
    );
    sellVolumeAmountDelta = snapshot.cumulativeSellVolumeAmount.minus(
      previousSnapshot.cumulativeSellVolumeAmount
    );
    totalVolumeUSDDelta = snapshot.cumulativeTotalVolumeUSD.minus(
      previousSnapshot.cumulativeTotalVolumeUSD
    );
    totalVolumeAmountDelta = snapshot.cumulativeTotalVolumeAmount.minus(
      previousSnapshot.cumulativeTotalVolumeAmount
    );
    netVolumeUSDDelta = snapshot.netVolumeUSD.minus(
      previousSnapshot.netVolumeUSD
    );
    netVolumeAmountDelta = snapshot.netVolumeAmount.minus(
      previousSnapshot.netVolumeAmount
    );
    activeUsersDelta =
      snapshot.cumulativeUniqueUsers - previousSnapshot.cumulativeUniqueUsers;
    buyCountDelta =
      snapshot.cumulativeBuyCount - previousSnapshot.cumulativeBuyCount;
    sellCountDelta =
      snapshot.cumulativeSellCount - previousSnapshot.cumulativeSellCount;
    transactionCountDelta =
      snapshot.cumulativeTransactionCount -
      previousSnapshot.cumulativeTransactionCount;
  }
  snapshot.dailySupplySideRevenueUSD = supplySideRevenueUSDDelta;
  snapshot.dailyProtocolSideRevenueUSD = protocolSideRevenueUSDDelta;
  snapshot.dailyTotalRevenueUSD = totalRevenueUSDDelta;
  snapshot.dailyBuyVolumeAmount = buyVolumeAmountDelta;
  snapshot.dailyBuyVolumeUSD = buyVolumeUSDDelta;
  snapshot.dailySellVolumeAmount = sellVolumeAmountDelta;
  snapshot.dailySellVolumeUSD = sellVolumeUSDDelta;
  snapshot.dailyTotalVolumeAmount = totalVolumeAmountDelta;
  snapshot.dailyTotalVolumeUSD = totalVolumeUSDDelta;
  snapshot.dailyNetVolumeAmount = netVolumeAmountDelta;
  snapshot.dailyNetVolumeUSD = netVolumeUSDDelta;
  snapshot.dailyActiveUsers = activeUsersDelta;
  snapshot.dailyBuyCount = buyCountDelta;
  snapshot.dailySellCount = sellCountDelta;
  snapshot.dailyTransactionCount = transactionCountDelta;

  snapshot.save();
}

export function takePoolHourlySnapshot(
  pool: Pool,
  event: ethereum.Event
): void {
  const hour = getHoursSinceEpoch(event.block.timestamp.toI32());
  const id = Bytes.empty()
    .concat(pool.id)
    .concat(Bytes.fromUTF8("-"))
    .concat(Bytes.fromI32(hour));
  const snapshot = new PoolHourlySnapshot(id);

  snapshot.hour = hour;
  snapshot.pool = pool.id;
  snapshot.protocol = NetworkConfigs.getFactoryAddress();
  snapshot.blockNumber = event.block.number;
  snapshot.timestamp = event.block.timestamp;

  snapshot.totalValueLockedUSD = pool.totalValueLockedUSD;
  snapshot.inputTokenBalances = pool.inputTokenBalances;
  snapshot.inputTokenBalancesUSD = pool.inputTokenBalancesUSD;

  snapshot.cumulativeSupplySideRevenueUSD = pool.cumulativeSupplySideRevenueUSD;
  snapshot.cumulativeProtocolSideRevenueUSD =
    pool.cumulativeProtocolSideRevenueUSD;
  snapshot.cumulativeTotalRevenueUSD = pool.cumulativeTotalRevenueUSD;

  let supplySideRevenueUSDDelta = snapshot.cumulativeSupplySideRevenueUSD;
  let protocolSideRevenueUSDDelta = snapshot.cumulativeProtocolSideRevenueUSD;
  let totalRevenueUSDDelta = snapshot.cumulativeTotalRevenueUSD;

  const previousHour = getHoursSinceEpoch(
    pool._lastHourlySnapshotTimestamp!.toI32()
  );
  const previousSnapshot = PoolHourlySnapshot.load(Bytes.fromI32(previousHour));
  if (previousSnapshot) {
    supplySideRevenueUSDDelta = snapshot.cumulativeSupplySideRevenueUSD.minus(
      previousSnapshot.cumulativeSupplySideRevenueUSD
    );
    protocolSideRevenueUSDDelta =
      snapshot.cumulativeProtocolSideRevenueUSD.minus(
        previousSnapshot.cumulativeProtocolSideRevenueUSD
      );
    totalRevenueUSDDelta = snapshot.cumulativeTotalRevenueUSD.minus(
      previousSnapshot.cumulativeTotalRevenueUSD
    );
  }
  snapshot.hourlySupplySideRevenueUSD = supplySideRevenueUSDDelta;
  snapshot.hourlyProtocolSideRevenueUSD = protocolSideRevenueUSDDelta;
  snapshot.hourlyTotalRevenueUSD = totalRevenueUSDDelta;

  snapshot.save();
}

export function takePoolSnapshots(pool: Pool, event: ethereum.Event): void {
  if (
    pool._lastDailySnapshotTimestamp
      .plus(BigInt.fromI32(SECONDS_PER_DAY))
      .lt(event.block.timestamp)
  ) {
    takePoolDailySnapshot(pool, event);

    pool._lastDailySnapshotTimestamp = event.block.timestamp;
    pool.save();
  }
  if (
    pool._lastHourlySnapshotTimestamp
      .plus(BigInt.fromI32(SECONDS_PER_HOUR))
      .lt(event.block.timestamp)
  ) {
    takePoolHourlySnapshot(pool, event);

    pool._lastHourlySnapshotTimestamp = event.block.timestamp;
    pool.save();
  }
}
