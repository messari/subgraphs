import { dataSource, near, BigInt } from "@graphprotocol/graph-ts";
import {
  LendingProtocol,
  UsageMetricsDailySnapshot,
  UsageMetricsHourlySnapshot,
  FinancialsDailySnapshot,
} from "../../generated/schema";
import {
  BD_ZERO,
  LendingType,
  NANOSEC_TO_SEC,
  Network,
  ProtocolType,
  PROTOCOL_NAME,
  PROTOCOL_SLUG,
  RiskType,
  NANOS_TO_DAY,
  NANOS_TO_HOUR,
  BI,
} from "../utils/const";
import { Versions } from "../versions";

export function getOrCreateProtocol(): LendingProtocol {
  let protocol = LendingProtocol.load(dataSource.address().toString());
  if (!protocol) {
    protocol = new LendingProtocol(dataSource.address().toString());
    protocol.name = PROTOCOL_NAME;
    protocol.slug = PROTOCOL_SLUG;
    protocol.network = Network.NEAR_MAINNET;
    protocol.type = ProtocolType.LENDING;
    protocol.lendingType = LendingType.POOLED;
    protocol.riskType = RiskType.GLOBAL;
    protocol.totalValueLockedUSD = BD_ZERO;
    protocol.totalDepositBalanceUSD = BD_ZERO;
    protocol.totalBorrowBalanceUSD = BD_ZERO;
    protocol.cumulativeDepositUSD = BD_ZERO;
    protocol.cumulativeBorrowUSD = BD_ZERO;
    protocol.cumulativeLiquidateUSD = BD_ZERO;
    protocol.cumulativeUniqueUsers = 0;
    protocol.cumulativeUniqueDepositors = 0;
    protocol.cumulativeUniqueBorrowers = 0;
    protocol.cumulativeUniqueLiquidators = 0;
    protocol.cumulativeUniqueLiquidatees = 0;
    protocol.cumulativeSupplySideRevenueUSD = BD_ZERO;
    protocol.cumulativeProtocolSideRevenueUSD = BD_ZERO;
    protocol.cumulativeTotalRevenueUSD = BD_ZERO;
    protocol.totalPoolCount = 0;
    protocol.openPositionCount = 0;
    protocol.cumulativePositionCount = 0;
    protocol._oracle = "";
    protocol._maxAssets = 0;
    protocol._booster = "";
    protocol._boosterMultiplier = BI("0");
    protocol._owner = "";
    protocol._marketIds = [];
  }

  protocol.schemaVersion = Versions.getSchemaVersion();
  protocol.subgraphVersion = Versions.getSubgraphVersion();
  protocol.methodologyVersion = Versions.getMethodologyVersion();
  protocol.save();

  return protocol;
}

export function getOrCreateUsageMetricsDailySnapshot(
  receipt: near.ReceiptWithOutcome
): UsageMetricsDailySnapshot {
  const timestamp = NANOS_TO_DAY(receipt.block.header.timestampNanosec);
  const id = timestamp.toString();
  let usageMetricsDailySnapshot = UsageMetricsDailySnapshot.load(id);
  const protocol = getOrCreateProtocol();
  if (!usageMetricsDailySnapshot) {
    usageMetricsDailySnapshot = new UsageMetricsDailySnapshot(id);
    usageMetricsDailySnapshot.protocol = protocol.id;
    usageMetricsDailySnapshot.dailyActiveUsers = 0;
    usageMetricsDailySnapshot.dailyActiveDepositors = 0;
    usageMetricsDailySnapshot.dailyActiveBorrowers = 0;
    usageMetricsDailySnapshot.dailyActiveLiquidators = 0;
    usageMetricsDailySnapshot.dailyActiveLiquidatees = 0;
    usageMetricsDailySnapshot.dailyTransactionCount = 0;
    usageMetricsDailySnapshot.dailyDepositCount = 0;
    usageMetricsDailySnapshot.dailyWithdrawCount = 0;
    usageMetricsDailySnapshot.dailyBorrowCount = 0;
    usageMetricsDailySnapshot.dailyRepayCount = 0;
    usageMetricsDailySnapshot.dailyLiquidateCount = 0;
  }
  usageMetricsDailySnapshot.cumulativeUniqueLiquidatees =
    protocol.cumulativeUniqueLiquidatees;
  usageMetricsDailySnapshot.cumulativeUniqueLiquidators =
    protocol.cumulativeUniqueLiquidators;
  usageMetricsDailySnapshot.cumulativeUniqueUsers =
    protocol.cumulativeUniqueUsers;
  usageMetricsDailySnapshot.cumulativeUniqueDepositors =
    protocol.cumulativeUniqueDepositors;
  usageMetricsDailySnapshot.cumulativeUniqueBorrowers =
    protocol.cumulativeUniqueBorrowers;
  usageMetricsDailySnapshot.totalPoolCount = protocol._marketIds.length;
  usageMetricsDailySnapshot.blockNumber = BigInt.fromU64(
    receipt.block.header.height
  );
  usageMetricsDailySnapshot.timestamp = BigInt.fromU64(
    NANOSEC_TO_SEC(receipt.block.header.timestampNanosec)
  );
  usageMetricsDailySnapshot.save();
  return usageMetricsDailySnapshot as UsageMetricsDailySnapshot;
}

// UsageMetricsHourlySnapshot
export function getOrCreateUsageMetricsHourlySnapshot(
  receipt: near.ReceiptWithOutcome
): UsageMetricsHourlySnapshot {
  const timestamp = NANOS_TO_HOUR(receipt.block.header.timestampNanosec);
  const id = timestamp.toString();
  let usageMetricsHourlySnapshot = UsageMetricsHourlySnapshot.load(id);
  const protocol = getOrCreateProtocol();
  if (!usageMetricsHourlySnapshot) {
    usageMetricsHourlySnapshot = new UsageMetricsHourlySnapshot(id);
    usageMetricsHourlySnapshot.protocol = protocol.id;
    usageMetricsHourlySnapshot.hourlyActiveUsers = 0;
    usageMetricsHourlySnapshot.hourlyTransactionCount = 0;
    usageMetricsHourlySnapshot.hourlyDepositCount = 0;
    usageMetricsHourlySnapshot.hourlyWithdrawCount = 0;
    usageMetricsHourlySnapshot.hourlyBorrowCount = 0;
    usageMetricsHourlySnapshot.hourlyRepayCount = 0;
    usageMetricsHourlySnapshot.hourlyLiquidateCount = 0;
  }
  usageMetricsHourlySnapshot.cumulativeUniqueUsers =
    protocol.cumulativeUniqueUsers;
  usageMetricsHourlySnapshot.blockNumber = BigInt.fromU64(
    receipt.block.header.height
  );
  usageMetricsHourlySnapshot.timestamp = BigInt.fromU64(
    NANOSEC_TO_SEC(receipt.block.header.timestampNanosec)
  );
  usageMetricsHourlySnapshot.save();

  return usageMetricsHourlySnapshot as UsageMetricsHourlySnapshot;
}

export function getOrCreateFinancialDailySnapshot(
  receipt: near.ReceiptWithOutcome
): FinancialsDailySnapshot {
  const timestamp = NANOS_TO_DAY(receipt.block.header.timestampNanosec);
  const id = timestamp.toString();
  let financialsDailySnapshot = FinancialsDailySnapshot.load(id);
  const protocol = getOrCreateProtocol();
  if (!financialsDailySnapshot) {
    financialsDailySnapshot = new FinancialsDailySnapshot(id);
    financialsDailySnapshot.protocol = protocol.id;
    financialsDailySnapshot.protocolControlledValueUSD = BD_ZERO;
    financialsDailySnapshot.dailySupplySideRevenueUSD = BD_ZERO;
    financialsDailySnapshot.dailyProtocolSideRevenueUSD = BD_ZERO;
    financialsDailySnapshot.dailyTotalRevenueUSD = BD_ZERO;
    financialsDailySnapshot.dailyDepositUSD = BD_ZERO;
    financialsDailySnapshot.dailyBorrowUSD = BD_ZERO;
    financialsDailySnapshot.dailyLiquidateUSD = BD_ZERO;
    financialsDailySnapshot.dailyWithdrawUSD = BD_ZERO;
    financialsDailySnapshot.dailyRepayUSD = BD_ZERO;
  }
  financialsDailySnapshot.totalValueLockedUSD = protocol.totalValueLockedUSD;
  financialsDailySnapshot.cumulativeSupplySideRevenueUSD =
    protocol.cumulativeSupplySideRevenueUSD;
  financialsDailySnapshot.cumulativeProtocolSideRevenueUSD =
    protocol.cumulativeProtocolSideRevenueUSD;
  financialsDailySnapshot.cumulativeTotalRevenueUSD =
    protocol.cumulativeTotalRevenueUSD;
  financialsDailySnapshot.totalDepositBalanceUSD =
    protocol.totalDepositBalanceUSD;
  financialsDailySnapshot.cumulativeBorrowUSD = protocol.cumulativeBorrowUSD;
  financialsDailySnapshot.cumulativeDepositUSD = protocol.cumulativeDepositUSD;
  financialsDailySnapshot.totalBorrowBalanceUSD =
    protocol.totalBorrowBalanceUSD;
  financialsDailySnapshot.cumulativeLiquidateUSD =
    protocol.cumulativeLiquidateUSD;
  financialsDailySnapshot.blockNumber = BigInt.fromU64(
    receipt.block.header.height
  );
  financialsDailySnapshot.timestamp = BigInt.fromU64(
    NANOSEC_TO_SEC(receipt.block.header.timestampNanosec)
  );
  financialsDailySnapshot.save();
  return financialsDailySnapshot as FinancialsDailySnapshot;
}
