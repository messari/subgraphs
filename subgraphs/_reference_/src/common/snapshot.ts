import { Bytes, ethereum } from "@graphprotocol/graph-ts";
import { SECONDS_PER_DAY, SECONDS_PER_HOUR } from "./constants";
import {
  DexAmmProtocol,
  UsageMetricsDailySnapshot,
  FinancialsDailySnapshot,
  UsageMetricsHourlySnapshot,
  LiquidityPoolDailySnapshot,
  LiquidityPoolHourlySnapshot,
  LiquidityPool,
  _ActivityHelper,
} from "../../generated/schema";

const ActivityHelperID = Bytes.fromUTF8("_ActivityHelper");

export function createProtocolSnapshots(
  event: ethereum.Event,
  protocol: DexAmmProtocol
): void {
  const dayID = event.block.timestamp.toI32() / SECONDS_PER_DAY;
  const hourID = event.block.timestamp.toI32() / SECONDS_PER_HOUR;
  const snapshotDayID = protocol.lastUpdateTimestamp.toI32() / SECONDS_PER_DAY;
  const snapshotHourID =
    protocol.lastUpdateTimestamp.toI32() / SECONDS_PER_HOUR;

  if (snapshotDayID != dayID) {
    takeFinancialsDailySnapshot(event, protocol, snapshotDayID);
    takeUsageDailySnapshot(event, protocol, snapshotDayID);
    protocol.lastSnapshotDayID = snapshotDayID;
    protocol.save();
  }
  if (snapshotHourID != hourID) {
    takeUsageHourlySnapshot(event, protocol, snapshotHourID);
    protocol.lastSnapshotHourID = snapshotHourID;
    protocol.save();
  }
}

export function createLiquidityPoolSnapshots(
  event: ethereum.Event,
  pool: LiquidityPool
): void {
  const dayID = event.block.timestamp.toI32() / SECONDS_PER_DAY;
  const hourID = event.block.timestamp.toI32() / SECONDS_PER_HOUR;
  const snapshotDayID = pool.lastUpdateTimestamp.toI32() / SECONDS_PER_DAY;
  const snapshotHourID = pool.lastUpdateTimestamp.toI32() / SECONDS_PER_HOUR;

  if (snapshotDayID != dayID) {
    takeLiquidityPoolDailySnapshot(event, pool, snapshotDayID);
    pool.lastSnapshotDayID = snapshotDayID;
    pool.save();
  }

  if (snapshotHourID != hourID) {
    takeLiquidityPoolHourlySnapshot(event, pool, snapshotHourID);
    pool.lastSnapshotHourID = snapshotHourID;
    pool.save();
  }
}

function takeFinancialsDailySnapshot(
  event: ethereum.Event,
  protocol: DexAmmProtocol,
  day: i32
): void {
  const snapshot = new FinancialsDailySnapshot(Bytes.fromI32(day));
  const previousSnapshot = FinancialsDailySnapshot.load(
    protocol.lastSnapshotDayID
  );

  snapshot.day = day;
  snapshot.protocol = protocol.id;
  snapshot.blockNumber = event.block.number;
  snapshot.timestamp = event.block.timestamp;

  // tvl
  snapshot.totalValueLockedUSD = protocol.totalValueLockedUSD;
  snapshot.protocolControlledValueUSD = protocol.protocolControlledValueUSD;

  // revenues
  snapshot.cumulativeSupplySideRevenueUSD =
    protocol.cumulativeSupplySideRevenueUSD;
  snapshot.cumulativeProtocolSideRevenueUSD =
    protocol.cumulativeProtocolSideRevenueUSD;
  snapshot.cumulativeTotalRevenueUSD = protocol.cumulativeTotalRevenueUSD;

  // deltas
  let supplySideRevenueDelta = snapshot.cumulativeSupplySideRevenueUSD;
  let protocolSideRevenueDelta = snapshot.cumulativeProtocolSideRevenueUSD;
  let totalRevenueDelta = snapshot.cumulativeTotalRevenueUSD;

  if (previousSnapshot) {
    supplySideRevenueDelta = snapshot.cumulativeSupplySideRevenueUSD.minus(
      previousSnapshot.cumulativeSupplySideRevenueUSD
    );
    protocolSideRevenueDelta = snapshot.cumulativeProtocolSideRevenueUSD.minus(
      previousSnapshot.cumulativeProtocolSideRevenueUSD
    );
    totalRevenueDelta = snapshot.cumulativeTotalRevenueUSD.minus(
      previousSnapshot.cumulativeTotalRevenueUSD
    );
  }
  snapshot.dailySupplySideRevenueUSD = supplySideRevenueDelta;
  snapshot.dailyProtocolSideRevenueUSD = protocolSideRevenueDelta;
  snapshot.dailyTotalRevenueUSD = totalRevenueDelta;

  snapshot.save();
}

function takeUsageDailySnapshot(
  event: ethereum.Event,
  protocol: DexAmmProtocol,
  day: i32
): void {
  const activity = initActivityHelper();

  const snapshot = new UsageMetricsDailySnapshot(Bytes.fromI32(day));
  const previousSnapshot = UsageMetricsDailySnapshot.load(
    protocol.lastSnapshotDayID
  );

  snapshot.protocol = protocol.id;
  snapshot.day = day;
  snapshot.blockNumber = event.block.number;
  snapshot.timestamp = event.block.timestamp;

  // unique users
  snapshot.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers;
  snapshot.cumulativeUniqueTransferSenders =
    protocol.cumulativeUniqueTransferSenders;
  snapshot.cumulativeUniqueTransferReceivers =
    protocol.cumulativeUniqueTransferReceivers;
  snapshot.cumulativeUniqueLiquidityProviders =
    protocol.cumulativeUniqueLiquidityProviders;
  snapshot.cumulativeUniqueMessageSenders =
    protocol.cumulativeUniqueMessageSenders;

  // daily activity
  snapshot.dailyActiveUsers = activity.dailyActiveUsers;

  // transaction counts
  snapshot.cumulativeTransactionCount = protocol.cumulativeTransactionCount;

  // misc
  snapshot.totalPoolCount = protocol.totalPoolCount;

  // deltas
  let transactionDelta = snapshot.cumulativeTransactionCount;

  if (previousSnapshot) {
    transactionDelta =
      snapshot.cumulativeTransactionCount -
      previousSnapshot.cumulativeTransactionCount;
  }
  snapshot.dailyTransactionCount = transactionDelta;
  snapshot.save();

  activity.dailyActiveUsers = 0;
  activity.save();
}

function takeUsageHourlySnapshot(
  event: ethereum.Event,
  protocol: DexAmmProtocol,
  hour: i32
): void {
  const activity = initActivityHelper();

  const snapshot = new UsageMetricsHourlySnapshot(Bytes.fromI32(hour));
  const previousSnapshot = UsageMetricsHourlySnapshot.load(
    protocol.lastSnapshotHourID
  );

  snapshot.protocol = protocol.id;
  snapshot.hour = hour;
  snapshot.blockNumber = event.block.number;
  snapshot.timestamp = event.block.timestamp;

  // unique users
  snapshot.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers;

  // hourly activity
  snapshot.hourlyActiveUsers = activity.hourlyActiveUsers;

  // transaction counts
  snapshot.cumulativeTransactionCount = protocol.cumulativeTransactionCount;

  // deltas
  let transactionDelta = snapshot.cumulativeTransactionCount;
  if (previousSnapshot) {
    transactionDelta =
      snapshot.cumulativeTransactionCount -
      previousSnapshot.cumulativeTransactionCount;
  }
  snapshot.hourlyTransactionCount = transactionDelta;
  snapshot.save();

  activity.hourlyActiveUsers = 0;
  activity.save();
}

function takeLiquidityPoolHourlySnapshot(
  event: ethereum.Event,
  pool: LiquidityPool,
  hour: i32
): void {
  const snapshot = new LiquidityPoolHourlySnapshot(pool.id.concatI32(hour));
  const previousSnapshot = LiquidityPoolHourlySnapshot.load(
    pool.id.concatI32(pool.lastSnapshotHourID)
  );

  snapshot.hour = hour;
  snapshot.protocol = pool.protocol;
  snapshot.pool = pool.id;
  snapshot.timestamp = event.block.timestamp;
  snapshot.blockNumber = event.block.number;

  // tvl and balances
  snapshot.totalValueLockedUSD = pool.totalValueLockedUSD;
  snapshot.inputTokenBalance = pool.inputTokenBalance;
  snapshot.totalLiquidity = pool.totalLiquidity;
  snapshot.totalLiquidityUSD = pool.totalLiquidityUSD;
  snapshot.stakedLiquidity = pool.stakedLiquidity;
  snapshot.rewardTokenEmissions = pool.rewardTokenEmissions;
  snapshot.rewardTokenEmissionsUSD = pool.rewardTokenEmissionsUSD;

  // revenues
  snapshot.cumulativeSupplySideRevenueUSD = pool.cumulativeSupplySideRevenueUSD;
  snapshot.cumulativeProtocolSideRevenueUSD =
    pool.cumulativeProtocolSideRevenueUSD;
  snapshot.cumulativeTotalRevenueUSD = pool.cumulativeTotalRevenueUSD;

  // deltas
  let supplySideRevenueDelta = snapshot.cumulativeSupplySideRevenueUSD;
  let protocolSideRevenueDelta = snapshot.cumulativeProtocolSideRevenueUSD;
  let totalRevenueDelta = snapshot.cumulativeTotalRevenueUSD;

  if (previousSnapshot) {
    supplySideRevenueDelta = snapshot.cumulativeSupplySideRevenueUSD.minus(
      previousSnapshot.cumulativeSupplySideRevenueUSD
    );
    protocolSideRevenueDelta = snapshot.cumulativeProtocolSideRevenueUSD.minus(
      previousSnapshot.cumulativeProtocolSideRevenueUSD
    );
    totalRevenueDelta = snapshot.cumulativeTotalRevenueUSD.minus(
      previousSnapshot.cumulativeTotalRevenueUSD
    );
  }
  snapshot.hourlySupplySideRevenueUSD = supplySideRevenueDelta;
  snapshot.hourlyProtocolSideRevenueUSD = protocolSideRevenueDelta;
  snapshot.hourlyTotalRevenueUSD = totalRevenueDelta;

  snapshot.save();
}

function takeLiquidityPoolDailySnapshot(
  event: ethereum.Event,
  pool: LiquidityPool,
  day: i32
): void {
  const snapshot = new LiquidityPoolDailySnapshot(pool.id.concatI32(day));
  const previousSnapshot = LiquidityPoolDailySnapshot.load(
    pool.id.concatI32(pool.lastSnapshotDayID)
  );

  snapshot.day = day;
  snapshot.protocol = pool.protocol;
  snapshot.pool = pool.id;
  snapshot.timestamp = event.block.timestamp;
  snapshot.blockNumber = event.block.number;

  // tvl and balances
  snapshot.totalValueLockedUSD = pool.totalValueLockedUSD;
  snapshot.inputTokenBalance = pool.inputTokenBalance;
  snapshot.totalLiquidity = pool.totalLiquidity;
  snapshot.totalLiquidityUSD = pool.totalLiquidityUSD;
  snapshot.stakedLiquidity = pool.stakedLiquidity;
  snapshot.rewardTokenEmissions = pool.rewardTokenEmissions;
  snapshot.rewardTokenEmissionsUSD = pool.rewardTokenEmissionsUSD;

  // revenues
  snapshot.cumulativeSupplySideRevenueUSD = pool.cumulativeSupplySideRevenueUSD;
  snapshot.cumulativeProtocolSideRevenueUSD =
    pool.cumulativeProtocolSideRevenueUSD;
  snapshot.cumulativeTotalRevenueUSD = pool.cumulativeTotalRevenueUSD;

  // deltas
  let supplySideRevenueDelta = snapshot.cumulativeSupplySideRevenueUSD;
  let protocolSideRevenueDelta = snapshot.cumulativeProtocolSideRevenueUSD;
  let totalRevenueDelta = snapshot.cumulativeTotalRevenueUSD;

  if (previousSnapshot) {
    supplySideRevenueDelta = snapshot.cumulativeSupplySideRevenueUSD.minus(
      previousSnapshot.cumulativeSupplySideRevenueUSD
    );
    protocolSideRevenueDelta = snapshot.cumulativeProtocolSideRevenueUSD.minus(
      previousSnapshot.cumulativeProtocolSideRevenueUSD
    );
    totalRevenueDelta = snapshot.cumulativeTotalRevenueUSD.minus(
      previousSnapshot.cumulativeTotalRevenueUSD
    );
  }
  snapshot.dailySupplySideRevenueUSD = supplySideRevenueDelta;
  snapshot.dailyProtocolSideRevenueUSD = protocolSideRevenueDelta;
  snapshot.dailyTotalRevenueUSD = totalRevenueDelta;

  snapshot.save();
}

function initActivityHelper(): _ActivityHelper {
  let helper = _ActivityHelper.load(ActivityHelperID);
  if (helper) {
    return helper;
  }
  helper = new _ActivityHelper(ActivityHelperID);
  helper.hourlyActiveUsers = 0;
  helper.dailyActiveUsers = 0;

  helper.save();
  return helper;
}
