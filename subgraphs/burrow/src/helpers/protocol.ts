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
} from "../utils/const";
import { Versions } from "../versions";

export function getOrCreateProtocol(): LendingProtocol {
  let protocol = LendingProtocol.load(dataSource.address().toString());
  if (!protocol) {
    protocol = new LendingProtocol(dataSource.address().toString());
    protocol.name = PROTOCOL_NAME;
    protocol.slug = PROTOCOL_SLUG;
    protocol.schemaVersion = Versions.getSchemaVersion();
    protocol.subgraphVersion = Versions.getSubgraphVersion();
    protocol.methodologyVersion = Versions.getMethodologyVersion();
    protocol.network = Network.NEAR_MAINNET;
    protocol.type = ProtocolType.LENDING;
    protocol.lendingType = LendingType.POOLED;
    protocol.riskType = RiskType.GLOBAL;
    protocol.totalValueLockedUSD = BD_ZERO;
    protocol.cumulativeUniqueUsers = 0;
    protocol.cumulativeSupplySideRevenueUSD = BD_ZERO;
    protocol.cumulativeProtocolSideRevenueUSD = BD_ZERO;
    protocol.cumulativeTotalRevenueUSD = BD_ZERO;
    protocol.totalPoolCount = 0;
    protocol._marketIds = new Array<string>();
    protocol.save();
  }
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
    usageMetricsDailySnapshot.dailyActiveUsers = 0;
    usageMetricsDailySnapshot.cumulativeUniqueUsers =
      protocol.cumulativeUniqueUsers;
    usageMetricsDailySnapshot.cumulativeUniqueDepositors =
      protocol.cumulativeUniqueDepositors;
    usageMetricsDailySnapshot.cumulativeUniqueBorrowers =
      protocol.cumulativeUniqueBorrowers;
    usageMetricsDailySnapshot.dailyActiveLiquidators = 0;
    usageMetricsDailySnapshot.cumulativeUniqueLiquidators =
      protocol.cumulativeUniqueLiquidators;
    usageMetricsDailySnapshot.dailyActiveLiquidatees = 0;
    usageMetricsDailySnapshot.cumulativeUniqueLiquidatees =
      protocol.cumulativeUniqueLiquidatees;
    usageMetricsDailySnapshot.dailyTransactionCount = 0;
    usageMetricsDailySnapshot.dailyDepositCount = 0;
    usageMetricsDailySnapshot.dailyWithdrawCount = 0;
    usageMetricsDailySnapshot.dailyBorrowCount = 0;
    usageMetricsDailySnapshot.dailyRepayCount = 0;
    usageMetricsDailySnapshot.dailyLiquidateCount = 0;
    usageMetricsDailySnapshot.totalPoolCount = protocol._marketIds.length;
    usageMetricsDailySnapshot.blockNumber = BigInt.fromU64(
      receipt.block.header.height
    );
    usageMetricsDailySnapshot.timestamp = BigInt.fromU64(
      NANOSEC_TO_SEC(receipt.block.header.timestampNanosec)
    );
    usageMetricsDailySnapshot.save();
  }
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
    usageMetricsHourlySnapshot.hourlyActiveUsers = 0;
    usageMetricsHourlySnapshot.cumulativeUniqueUsers =
      protocol.cumulativeUniqueUsers;
    usageMetricsHourlySnapshot.hourlyTransactionCount = 0;
    usageMetricsHourlySnapshot.hourlyDepositCount = 0;
    usageMetricsHourlySnapshot.hourlyWithdrawCount = 0;
    usageMetricsHourlySnapshot.hourlyBorrowCount = 0;
    usageMetricsHourlySnapshot.hourlyRepayCount = 0;
    usageMetricsHourlySnapshot.hourlyLiquidateCount = 0;
    usageMetricsHourlySnapshot.blockNumber = BigInt.fromU64(
      receipt.block.header.height
    );
    usageMetricsHourlySnapshot.timestamp = BigInt.fromU64(
      NANOSEC_TO_SEC(receipt.block.header.timestampNanosec)
    );
    usageMetricsHourlySnapshot.save();
  }
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
    financialsDailySnapshot.protocol = getOrCreateProtocol().id;
    financialsDailySnapshot.blockNumber = BigInt.fromU64(
      receipt.block.header.height
    );
    financialsDailySnapshot.timestamp = BigInt.fromU64(
      NANOSEC_TO_SEC(receipt.block.header.timestampNanosec)
    );
    financialsDailySnapshot.totalValueLockedUSD = protocol.totalValueLockedUSD;
    financialsDailySnapshot.protocolControlledValueUSD = BD_ZERO;
    financialsDailySnapshot.dailySupplySideRevenueUSD = BD_ZERO;
    financialsDailySnapshot.cumulativeSupplySideRevenueUSD =
      protocol.cumulativeSupplySideRevenueUSD;
    financialsDailySnapshot.dailyProtocolSideRevenueUSD = BD_ZERO;
    financialsDailySnapshot.cumulativeProtocolSideRevenueUSD =
      protocol.cumulativeProtocolSideRevenueUSD;
    financialsDailySnapshot.dailyTotalRevenueUSD = BD_ZERO;
    financialsDailySnapshot.cumulativeTotalRevenueUSD =
      protocol.cumulativeTotalRevenueUSD;
    financialsDailySnapshot.totalDepositBalanceUSD =
      protocol.totalDepositBalanceUSD;
    financialsDailySnapshot.dailyDepositUSD = BD_ZERO;
    financialsDailySnapshot.cumulativeDepositUSD =
      protocol.cumulativeDepositUSD;
    financialsDailySnapshot.totalBorrowBalanceUSD =
      protocol.totalBorrowBalanceUSD;
    financialsDailySnapshot.dailyBorrowUSD = BD_ZERO;
    financialsDailySnapshot.cumulativeBorrowUSD = protocol.cumulativeBorrowUSD;
    financialsDailySnapshot.dailyLiquidateUSD = BD_ZERO;
    financialsDailySnapshot.cumulativeLiquidateUSD =
      protocol.cumulativeLiquidateUSD;
    financialsDailySnapshot.dailyWithdrawUSD = BD_ZERO;
    financialsDailySnapshot.dailyRepayUSD = BD_ZERO;
    financialsDailySnapshot.save();
  }
  return financialsDailySnapshot as FinancialsDailySnapshot;
}
