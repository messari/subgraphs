import {
  Address,
  BigDecimal,
  dataSource,
  ethereum,
} from "@graphprotocol/graph-ts";
import {
  FinancialsDailySnapshot,
  UsageMetricsDailySnapshot,
  Account,
  DexAmmProtocol,
  UsageMetricsHourlySnapshot,
  ActiveAccount,
  LiquidityPool,
} from "../../generated/schema";
import {
  BIGDECIMAL_ZERO,
  DEPLOYER_ADDRESS,
  INT_ZERO,
  ProtocolType,
  PROTOCOL_NAME,
  PROTOCOL_SLUG,
  SECONDS_PER_DAY,
  SECONDS_PER_HOUR,
} from "../utils/constants";
import { Versions } from "../versions";
import {
  getOrCreatePoolDailySnapshot,
  getOrCreatePoolHourlySnapshot,
} from "./pool";

export function getOrCreateProtocol(): DexAmmProtocol {
  let protocol = DexAmmProtocol.load(DEPLOYER_ADDRESS);
  if (!protocol) {
    protocol = new DexAmmProtocol(DEPLOYER_ADDRESS);
    protocol.name = PROTOCOL_NAME;
    protocol.slug = PROTOCOL_SLUG;
    protocol.network = dataSource.network().toUpperCase().replace("-", "_");
    protocol.type = ProtocolType.EXCHANGE;
    protocol.totalValueLockedUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeVolumeUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeUniqueUsers = INT_ZERO;
    protocol.totalPoolCount = INT_ZERO;
  }

  protocol.schemaVersion = Versions.getSchemaVersion();
  protocol.subgraphVersion = Versions.getSubgraphVersion();
  protocol.methodologyVersion = Versions.getMethodologyVersion();

  protocol.save();

  return protocol;
}

export function getOrCreateUsageMetricsSnapshot(
  event: ethereum.Event
): UsageMetricsDailySnapshot {
  // Number of days since Unix epoch
  const id = `${event.block.timestamp.toI64() / SECONDS_PER_DAY}`;
  let usageMetrics = UsageMetricsDailySnapshot.load(id);
  if (!usageMetrics) {
    const protocol = getOrCreateProtocol();
    usageMetrics = new UsageMetricsDailySnapshot(id);
    usageMetrics.protocol = protocol.id;
    usageMetrics.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers;
    usageMetrics.totalPoolCount = protocol.totalPoolCount;

    usageMetrics.dailyActiveUsers = 0;
    usageMetrics.dailyTransactionCount = 0;
    usageMetrics.dailyDepositCount = 0;
    usageMetrics.dailyWithdrawCount = 0;
    usageMetrics.dailySwapCount = 0;
  }
  usageMetrics.blockNumber = event.block.number;
  usageMetrics.timestamp = event.block.timestamp;
  return usageMetrics;
}

export function getOrCreateUsageMetricsHourlySnapshot(
  event: ethereum.Event
): UsageMetricsHourlySnapshot {
  const timestamp = event.block.timestamp.toI64();
  const hours = timestamp / SECONDS_PER_HOUR;
  // Number of hours since Unix epoch
  const id = `${hours}`;
  let usageMetrics = UsageMetricsHourlySnapshot.load(id);
  if (!usageMetrics) {
    const protocol = getOrCreateProtocol();
    usageMetrics = new UsageMetricsHourlySnapshot(id);
    usageMetrics.protocol = protocol.id;
    usageMetrics.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers;

    usageMetrics.hourlyActiveUsers = 0;
    usageMetrics.hourlyTransactionCount = 0;
    usageMetrics.hourlyDepositCount = 0;
    usageMetrics.hourlyWithdrawCount = 0;
    usageMetrics.hourlySwapCount = 0;
  }
  usageMetrics.blockNumber = event.block.number;
  usageMetrics.timestamp = event.block.timestamp;
  return usageMetrics;
}

export function updateUsageMetrics(event: ethereum.Event, from: Address): void {
  const timestamp = event.block.timestamp.toI64();
  const day = `${timestamp / SECONDS_PER_DAY}`;
  const hour = `${(timestamp % SECONDS_PER_DAY) / SECONDS_PER_HOUR}`;
  const usageMetricsDailySnapshot = getOrCreateUsageMetricsSnapshot(event);
  const usageMetricsHourlySnapshot =
    getOrCreateUsageMetricsHourlySnapshot(event);

  const accountId = from.toHexString();
  let account = Account.load(accountId);
  if (!account) {
    account = new Account(accountId);
    account.save();
    const protocol = getOrCreateProtocol();
    protocol.cumulativeUniqueUsers += 1;
    protocol.save();
    usageMetricsDailySnapshot.cumulativeUniqueUsers += 1;
    usageMetricsHourlySnapshot.cumulativeUniqueUsers += 1;
  }

  // Combine the id and the user address to generate a unique user id for the day
  const dailyActiveAccountId = `${accountId}-${day}`;
  let dailyActiveAccount = ActiveAccount.load(dailyActiveAccountId);
  if (!dailyActiveAccount) {
    dailyActiveAccount = new ActiveAccount(dailyActiveAccountId);
    dailyActiveAccount.save();
    usageMetricsDailySnapshot.dailyActiveUsers += 1;
  }
  // Combine the id, user address and hour to generate a unique user id for the hour
  const hourlyActiveAccountId = `${accountId}-${day}-${hour}`;
  let hourlyActiveAccount = ActiveAccount.load(hourlyActiveAccountId);
  if (!hourlyActiveAccount) {
    hourlyActiveAccount = new ActiveAccount(hourlyActiveAccountId);
    hourlyActiveAccount.save();
    usageMetricsHourlySnapshot.hourlyActiveUsers += 1;
  }
  usageMetricsDailySnapshot.save();
  usageMetricsHourlySnapshot.save();
}

export function getOrCreateFinancialsSnapshot(
  event: ethereum.Event,
  protocol: DexAmmProtocol
): FinancialsDailySnapshot {
  // Number of days since Unix epoch
  const id = `${event.block.timestamp.toI64() / SECONDS_PER_DAY}`;
  let financialsSnapshot = FinancialsDailySnapshot.load(id);
  if (!financialsSnapshot) {
    financialsSnapshot = new FinancialsDailySnapshot(id);
    financialsSnapshot.protocol = protocol.id;
    financialsSnapshot.dailyVolumeUSD = BIGDECIMAL_ZERO;
    financialsSnapshot.dailySupplySideRevenueUSD = BIGDECIMAL_ZERO;
    financialsSnapshot.dailyProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    financialsSnapshot.dailyTotalRevenueUSD = BIGDECIMAL_ZERO;
  }
  financialsSnapshot.totalValueLockedUSD = protocol.totalValueLockedUSD;
  financialsSnapshot.cumulativeVolumeUSD = protocol.cumulativeVolumeUSD;
  financialsSnapshot.cumulativeSupplySideRevenueUSD =
    protocol.cumulativeSupplySideRevenueUSD;
  financialsSnapshot.cumulativeProtocolSideRevenueUSD =
    protocol.cumulativeProtocolSideRevenueUSD;
  financialsSnapshot.cumulativeTotalRevenueUSD =
    protocol.cumulativeTotalRevenueUSD;
  financialsSnapshot.blockNumber = event.block.number;
  financialsSnapshot.timestamp = event.block.timestamp;
  return financialsSnapshot;
}

export function incrementProtocolDepositCount(event: ethereum.Event): void {
  const usageMetricsDailySnapshot = getOrCreateUsageMetricsSnapshot(event);
  usageMetricsDailySnapshot.dailyDepositCount += 1;
  usageMetricsDailySnapshot.dailyTransactionCount += 1;
  usageMetricsDailySnapshot.save();
  const usageMetricsHourlySnapshot =
    getOrCreateUsageMetricsHourlySnapshot(event);
  usageMetricsHourlySnapshot.hourlyDepositCount += 1;
  usageMetricsHourlySnapshot.hourlyTransactionCount += 1;
  usageMetricsHourlySnapshot.save();
}

export function incrementProtocolWithdrawCount(event: ethereum.Event): void {
  const usageMetricsDailySnapshot = getOrCreateUsageMetricsSnapshot(event);
  usageMetricsDailySnapshot.dailyWithdrawCount += 1;
  usageMetricsDailySnapshot.dailyTransactionCount += 1;
  usageMetricsDailySnapshot.save();
  const usageMetricsHourlySnapshot =
    getOrCreateUsageMetricsHourlySnapshot(event);
  usageMetricsHourlySnapshot.hourlyWithdrawCount += 1;
  usageMetricsHourlySnapshot.hourlyTransactionCount += 1;
  usageMetricsHourlySnapshot.save();
}

export function incrementProtocolSwapCount(event: ethereum.Event): void {
  const usageMetricsDailySnapshot = getOrCreateUsageMetricsSnapshot(event);
  usageMetricsDailySnapshot.dailySwapCount += 1;
  usageMetricsDailySnapshot.dailyTransactionCount += 1;
  usageMetricsDailySnapshot.save();
  const usageMetricsHourlySnapshot =
    getOrCreateUsageMetricsHourlySnapshot(event);
  usageMetricsHourlySnapshot.hourlySwapCount += 1;
  usageMetricsHourlySnapshot.hourlyTransactionCount += 1;
  usageMetricsHourlySnapshot.save();
}

export function addProtocolUSDVolume(
  event: ethereum.Event,
  volumeUSD: BigDecimal
): void {
  const protocol = getOrCreateProtocol();
  protocol.cumulativeVolumeUSD = protocol.cumulativeVolumeUSD.plus(volumeUSD);
  protocol.save();
  const financialsSnapshot = getOrCreateFinancialsSnapshot(event, protocol);
  financialsSnapshot.dailyVolumeUSD =
    financialsSnapshot.dailyVolumeUSD.plus(volumeUSD);
  financialsSnapshot.save();
}

export function addProtocolUSDRevenue(
  event: ethereum.Event,
  pool: LiquidityPool,
  supplySideRevenueUSD: BigDecimal,
  protocolSideRevenueUSD: BigDecimal
): void {
  const protocol = getOrCreateProtocol();
  protocol.cumulativeSupplySideRevenueUSD =
    protocol.cumulativeSupplySideRevenueUSD.plus(supplySideRevenueUSD);
  protocol.cumulativeProtocolSideRevenueUSD =
    protocol.cumulativeProtocolSideRevenueUSD.plus(protocolSideRevenueUSD);
  protocol.cumulativeTotalRevenueUSD =
    protocol.cumulativeSupplySideRevenueUSD.plus(
      protocol.cumulativeProtocolSideRevenueUSD
    );
  protocol.save();

  const financialsSnapshot = getOrCreateFinancialsSnapshot(event, protocol);
  financialsSnapshot.dailySupplySideRevenueUSD =
    financialsSnapshot.dailySupplySideRevenueUSD.plus(supplySideRevenueUSD);
  financialsSnapshot.dailyProtocolSideRevenueUSD =
    financialsSnapshot.dailyProtocolSideRevenueUSD.plus(protocolSideRevenueUSD);
  financialsSnapshot.dailyTotalRevenueUSD =
    financialsSnapshot.dailySupplySideRevenueUSD.plus(
      financialsSnapshot.dailyProtocolSideRevenueUSD
    );
  financialsSnapshot.save();

  pool.cumulativeSupplySideRevenueUSD =
    pool.cumulativeSupplySideRevenueUSD.plus(supplySideRevenueUSD);
  pool.cumulativeProtocolSideRevenueUSD =
    pool.cumulativeProtocolSideRevenueUSD.plus(protocolSideRevenueUSD);
  pool.cumulativeTotalRevenueUSD = pool.cumulativeTotalRevenueUSD.plus(
    supplySideRevenueUSD.plus(protocolSideRevenueUSD)
  );
  pool.save();

  const poolDailySnapshot = getOrCreatePoolDailySnapshot(event, pool);
  poolDailySnapshot.dailySupplySideRevenueUSD =
    poolDailySnapshot.dailySupplySideRevenueUSD.plus(supplySideRevenueUSD);
  poolDailySnapshot.dailyProtocolSideRevenueUSD =
    poolDailySnapshot.dailyProtocolSideRevenueUSD.plus(protocolSideRevenueUSD);
  poolDailySnapshot.dailyTotalRevenueUSD =
    poolDailySnapshot.dailyTotalRevenueUSD.plus(
      supplySideRevenueUSD.plus(protocolSideRevenueUSD)
    );
  poolDailySnapshot.save();

  const poolHourlySnapshot = getOrCreatePoolHourlySnapshot(event, pool);
  poolHourlySnapshot.hourlySupplySideRevenueUSD =
    poolHourlySnapshot.hourlySupplySideRevenueUSD.plus(supplySideRevenueUSD);
  poolHourlySnapshot.hourlyProtocolSideRevenueUSD =
    poolHourlySnapshot.hourlyProtocolSideRevenueUSD.plus(
      protocolSideRevenueUSD
    );
  poolHourlySnapshot.hourlyTotalRevenueUSD =
    poolHourlySnapshot.hourlyTotalRevenueUSD.plus(
      supplySideRevenueUSD.plus(protocolSideRevenueUSD)
    );
  poolHourlySnapshot.save();
}

export function updateProtocolTVL(
  event: ethereum.Event,
  tvlChange: BigDecimal
): void {
  const protocol = getOrCreateProtocol();
  protocol.totalValueLockedUSD = protocol.totalValueLockedUSD.plus(tvlChange);
  protocol.save();
  const financialsSnapshot = getOrCreateFinancialsSnapshot(event, protocol);
  financialsSnapshot.save();
}

export function incrementProtocolTotalPoolCount(): void {
  const protocol = getOrCreateProtocol();
  protocol.totalPoolCount += 1;
  protocol.save();
}
