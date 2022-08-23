import { Address, BigDecimal, BigInt, ethereum } from "@graphprotocol/graph-ts";
import {
  FinancialsDailySnapshot,
  LendingProtocol,
  UsageMetricsDailySnapshot,
  ActiveAccount,
  Account,
  UsageMetricsHourlySnapshot,
} from "../../generated/schema";
import {
  BIGDECIMAL_ZERO,
  LendingType,
  Network,
  ProtocolType,
  PROTOCOL_METHODOLOGY_VERSION,
  PROTOCOL_NAME,
  PROTOCOL_SCHEMA_VERSION,
  PROTOCOL_SLUG,
  PROTOCOL_SUBGRAPH_VERSION,
  RiskType,
  SECONDS_PER_DAY,
  SECONDS_PER_HOUR,
  TROVE_MANAGER,
} from "../utils/constants";
import {
  getOrCreateMarket,
  getOrCreateMarketHourlySnapshot,
  getOrCreateMarketSnapshot,
} from "./market";
import { getLUSDToken } from "./token";

export function getOrCreateLiquityProtocol(): LendingProtocol {
  let protocol = LendingProtocol.load(TROVE_MANAGER);
  if (!protocol) {
    protocol = new LendingProtocol(TROVE_MANAGER);
    protocol.name = PROTOCOL_NAME;
    protocol.slug = PROTOCOL_SLUG;
    protocol.schemaVersion = PROTOCOL_SCHEMA_VERSION;
    protocol.subgraphVersion = PROTOCOL_SUBGRAPH_VERSION;
    protocol.methodologyVersion = PROTOCOL_METHODOLOGY_VERSION;
    protocol.network = Network.MAINNET;
    protocol.type = ProtocolType.LENDING;
    protocol.lendingType = LendingType.CDP;
    protocol.riskType = RiskType.ISOLATED;
    protocol.mintedTokens = [getLUSDToken().id];

    protocol.totalPoolCount = 1; // Only one active pool
    protocol.save();
  }
  return protocol;
}

export function getOrCreateUsageMetricsSnapshot(
  event: ethereum.Event
): UsageMetricsDailySnapshot {
  // Number of days since Unix epoch
  const id = `${event.block.timestamp.toI64() / SECONDS_PER_DAY}`;
  let usageMetrics = UsageMetricsDailySnapshot.load(id);
  if (!usageMetrics) {
    const protocol = getOrCreateLiquityProtocol();
    usageMetrics = new UsageMetricsDailySnapshot(id);
    usageMetrics.protocol = protocol.id;
    usageMetrics.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers;

    usageMetrics.totalPoolCount = protocol.totalPoolCount;
  }
  usageMetrics.blockNumber = event.block.number;
  usageMetrics.timestamp = event.block.timestamp;
  return usageMetrics;
}

export function getOrCreateUsageMetricsHourlySnapshot(
  event: ethereum.Event
): UsageMetricsHourlySnapshot {
  const timestamp = event.block.timestamp.toI64();
  const hour = timestamp / SECONDS_PER_HOUR;
  const id = `${hour}`;
  let usageMetrics = UsageMetricsHourlySnapshot.load(id);
  if (!usageMetrics) {
    const protocol = getOrCreateLiquityProtocol();
    usageMetrics = new UsageMetricsHourlySnapshot(id);
    usageMetrics.protocol = protocol.id;
    usageMetrics.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers;
  }
  usageMetrics.blockNumber = event.block.number;
  usageMetrics.timestamp = event.block.timestamp;
  return usageMetrics;
}

export function getOrCreateFinancialsSnapshot(
  event: ethereum.Event,
  protocol: LendingProtocol
): FinancialsDailySnapshot {
  // Number of days since Unix epoch
  const id = `${event.block.timestamp.toI64() / SECONDS_PER_DAY}`;
  let financialsSnapshot = FinancialsDailySnapshot.load(id);
  if (!financialsSnapshot) {
    financialsSnapshot = new FinancialsDailySnapshot(id);
    financialsSnapshot.protocol = protocol.id;

    financialsSnapshot.dailyWithdrawUSD = BIGDECIMAL_ZERO;
    financialsSnapshot.dailyRepayUSD = BIGDECIMAL_ZERO;
  }
  financialsSnapshot.totalValueLockedUSD = protocol.totalValueLockedUSD;
  financialsSnapshot.mintedTokenSupplies = protocol.mintedTokenSupplies;
  financialsSnapshot.cumulativeSupplySideRevenueUSD =
    protocol.cumulativeSupplySideRevenueUSD;
  financialsSnapshot.cumulativeProtocolSideRevenueUSD =
    protocol.cumulativeProtocolSideRevenueUSD;
  financialsSnapshot.cumulativeTotalRevenueUSD =
    protocol.cumulativeTotalRevenueUSD;
  financialsSnapshot.totalDepositBalanceUSD = protocol.totalDepositBalanceUSD;
  financialsSnapshot.cumulativeDepositUSD = protocol.cumulativeDepositUSD;
  financialsSnapshot.totalBorrowBalanceUSD = protocol.totalBorrowBalanceUSD;
  financialsSnapshot.cumulativeBorrowUSD = protocol.cumulativeBorrowUSD;
  financialsSnapshot.cumulativeLiquidateUSD = protocol.cumulativeLiquidateUSD;
  financialsSnapshot.blockNumber = event.block.number;
  financialsSnapshot.timestamp = event.block.timestamp;
  return financialsSnapshot;
}

// Keep track of cumulative unique users and daily/hourly active users
export function updateUsageMetrics(event: ethereum.Event, from: Address): void {
  const timestamp = event.block.timestamp.toI64();
  const day = `${timestamp / SECONDS_PER_DAY}`;
  const hour = `${(timestamp % SECONDS_PER_DAY) / SECONDS_PER_HOUR}`;
  const usageMetricsDailySnapshot = getOrCreateUsageMetricsSnapshot(event);
  const usageMetricsHourlySnapshot =
    getOrCreateUsageMetricsHourlySnapshot(event);

  let accountId = from.toHexString();
  let account = Account.load(accountId);
  if (!account) {
    account = new Account(accountId);
    account.save();
    const protocol = getOrCreateLiquityProtocol();
    protocol.cumulativeUniqueUsers += 1;
    protocol.save();
    usageMetricsDailySnapshot.cumulativeUniqueUsers += 1;
    usageMetricsHourlySnapshot.cumulativeUniqueUsers += 1;
  }

  // Combine the id and the user address to generate a unique user id for the day
  let dailyActiveAccountId = `${accountId}-${day}`;
  let dailyActiveAccount = ActiveAccount.load(dailyActiveAccountId);
  if (!dailyActiveAccount) {
    dailyActiveAccount = new ActiveAccount(dailyActiveAccountId);
    dailyActiveAccount.save();
    usageMetricsDailySnapshot.dailyActiveUsers += 1;
  }
  // Combine the id, user address and hour to generate a unique user id for the hour
  let hourlyActiveAccountId = `${accountId}-${day}-${hour}`;
  let hourlyActiveAccount = ActiveAccount.load(hourlyActiveAccountId);
  if (!hourlyActiveAccount) {
    hourlyActiveAccount = new ActiveAccount(hourlyActiveAccountId);
    hourlyActiveAccount.save();
    usageMetricsHourlySnapshot.hourlyActiveUsers += 1;
  }
  usageMetricsDailySnapshot.save();
  usageMetricsHourlySnapshot.save();
}

export function addProtocolSideRevenue(
  event: ethereum.Event,
  revenueAmountUSD: BigDecimal
): void {
  const protocol = getOrCreateLiquityProtocol();
  protocol.cumulativeProtocolSideRevenueUSD =
    protocol.cumulativeProtocolSideRevenueUSD.plus(revenueAmountUSD);
  protocol.cumulativeTotalRevenueUSD =
    protocol.cumulativeTotalRevenueUSD.plus(revenueAmountUSD);
  protocol.save();

  const financialsSnapshot = getOrCreateFinancialsSnapshot(event, protocol);
  financialsSnapshot.dailyProtocolSideRevenueUSD =
    financialsSnapshot.dailyProtocolSideRevenueUSD.plus(revenueAmountUSD);
  financialsSnapshot.dailyTotalRevenueUSD =
    financialsSnapshot.dailyTotalRevenueUSD.plus(revenueAmountUSD);
  financialsSnapshot.save();

  const market = getOrCreateMarket();
  market.cumulativeProtocolSideRevenueUSD =
    market.cumulativeProtocolSideRevenueUSD.plus(revenueAmountUSD);
  market.cumulativeTotalRevenueUSD =
    market.cumulativeTotalRevenueUSD.plus(revenueAmountUSD);
  market.save();

  const marketDailySnapshot = getOrCreateMarketSnapshot(event, market);
  marketDailySnapshot.dailyProtocolSideRevenueUSD =
    marketDailySnapshot.dailyProtocolSideRevenueUSD.plus(revenueAmountUSD);
  marketDailySnapshot.dailyTotalRevenueUSD =
    marketDailySnapshot.dailyTotalRevenueUSD.plus(revenueAmountUSD);
  marketDailySnapshot.save();

  const marketHourlySnapshot = getOrCreateMarketHourlySnapshot(event, market);
  marketHourlySnapshot.hourlyProtocolSideRevenueUSD =
    marketHourlySnapshot.hourlyProtocolSideRevenueUSD.plus(revenueAmountUSD);
  marketHourlySnapshot.hourlyTotalRevenueUSD =
    marketHourlySnapshot.hourlyTotalRevenueUSD.plus(revenueAmountUSD);
  marketHourlySnapshot.save();
}

export function addSupplySideRevenue(
  event: ethereum.Event,
  revenueAmountUSD: BigDecimal
): void {
  const protocol = getOrCreateLiquityProtocol();
  protocol.cumulativeSupplySideRevenueUSD =
    protocol.cumulativeSupplySideRevenueUSD.plus(revenueAmountUSD);
  protocol.cumulativeTotalRevenueUSD =
    protocol.cumulativeTotalRevenueUSD.plus(revenueAmountUSD);
  protocol.save();

  const financialsSnapshot = getOrCreateFinancialsSnapshot(event, protocol);
  financialsSnapshot.dailySupplySideRevenueUSD =
    financialsSnapshot.dailySupplySideRevenueUSD.plus(revenueAmountUSD);
  financialsSnapshot.dailyTotalRevenueUSD =
    financialsSnapshot.dailyTotalRevenueUSD.plus(revenueAmountUSD);
  financialsSnapshot.save();

  const market = getOrCreateMarket();
  market.cumulativeSupplySideRevenueUSD =
    market.cumulativeSupplySideRevenueUSD.plus(revenueAmountUSD);
  market.cumulativeTotalRevenueUSD =
    market.cumulativeTotalRevenueUSD.plus(revenueAmountUSD);
  market.save();

  const marketDailySnapshot = getOrCreateMarketSnapshot(event, market);
  marketDailySnapshot.dailySupplySideRevenueUSD =
    marketDailySnapshot.dailySupplySideRevenueUSD.plus(revenueAmountUSD);
  marketDailySnapshot.dailyTotalRevenueUSD =
    marketDailySnapshot.dailyTotalRevenueUSD.plus(revenueAmountUSD);
  marketDailySnapshot.save();

  const marketHourlySnapshot = getOrCreateMarketHourlySnapshot(event, market);
  marketHourlySnapshot.hourlySupplySideRevenueUSD =
    marketHourlySnapshot.hourlySupplySideRevenueUSD.plus(revenueAmountUSD);
  marketHourlySnapshot.hourlyTotalRevenueUSD =
    marketHourlySnapshot.hourlyTotalRevenueUSD.plus(revenueAmountUSD);
  marketHourlySnapshot.save();
}

export function addProtocolBorrowVolume(
  event: ethereum.Event,
  borrowedUSD: BigDecimal
): void {
  const protocol = getOrCreateLiquityProtocol();
  protocol.cumulativeBorrowUSD = protocol.cumulativeBorrowUSD.plus(borrowedUSD);
  protocol.save();
  const financialsSnapshot = getOrCreateFinancialsSnapshot(event, protocol);
  financialsSnapshot.dailyBorrowUSD =
    financialsSnapshot.dailyBorrowUSD.plus(borrowedUSD);
  financialsSnapshot.save();
  const usageMetricsDailySnapshot = getOrCreateUsageMetricsSnapshot(event);
  usageMetricsDailySnapshot.dailyBorrowCount += 1;
  usageMetricsDailySnapshot.dailyTransactionCount += 1;
  usageMetricsDailySnapshot.save();
  const usageMetricsHourlySnapshot =
    getOrCreateUsageMetricsHourlySnapshot(event);
  usageMetricsHourlySnapshot.hourlyBorrowCount += 1;
  usageMetricsHourlySnapshot.hourlyTransactionCount += 1;
  usageMetricsHourlySnapshot.save();
}

export function addProtocolDepositVolume(
  event: ethereum.Event,
  depositedUSD: BigDecimal
): void {
  const protocol = getOrCreateLiquityProtocol();
  protocol.cumulativeDepositUSD =
    protocol.cumulativeDepositUSD.plus(depositedUSD);
  protocol.save();
  const financialsSnapshot = getOrCreateFinancialsSnapshot(event, protocol);
  financialsSnapshot.dailyDepositUSD =
    financialsSnapshot.dailyDepositUSD.plus(depositedUSD);
  financialsSnapshot.save();
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

export function incrementProtocolRepayCount(event: ethereum.Event): void {
  const usageMetricsDailySnapshot = getOrCreateUsageMetricsSnapshot(event);
  usageMetricsDailySnapshot.dailyRepayCount += 1;
  usageMetricsDailySnapshot.dailyTransactionCount += 1;
  usageMetricsDailySnapshot.save();
  const usageMetricsHourlySnapshot =
    getOrCreateUsageMetricsHourlySnapshot(event);
  usageMetricsHourlySnapshot.hourlyRepayCount += 1;
  usageMetricsHourlySnapshot.hourlyTransactionCount += 1;
  usageMetricsHourlySnapshot.save();
}

export function incrementProtocolLiquidateCount(event: ethereum.Event): void {
  const usageMetricsDailySnapshot = getOrCreateUsageMetricsSnapshot(event);
  usageMetricsDailySnapshot.dailyLiquidateCount += 1;
  usageMetricsDailySnapshot.dailyTransactionCount += 1;
  usageMetricsDailySnapshot.save();
  const usageMetricsHourlySnapshot =
    getOrCreateUsageMetricsHourlySnapshot(event);
  usageMetricsHourlySnapshot.hourlyLiquidateCount += 1;
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

export function addProtocolLiquidateVolume(
  event: ethereum.Event,
  liquidatedUSD: BigDecimal
): void {
  const protocol = getOrCreateLiquityProtocol();
  protocol.cumulativeLiquidateUSD =
    protocol.cumulativeLiquidateUSD.plus(liquidatedUSD);
  protocol.save();
  const financialsSnapshot = getOrCreateFinancialsSnapshot(event, protocol);
  financialsSnapshot.dailyLiquidateUSD =
    financialsSnapshot.dailyLiquidateUSD.plus(liquidatedUSD);
  financialsSnapshot.save();
}

export function updateProtocolUSDLocked(
  event: ethereum.Event,
  netChangeUSD: BigDecimal
): void {
  const protocol = getOrCreateLiquityProtocol();
  const totalValueLocked = protocol.totalValueLockedUSD.plus(netChangeUSD);
  protocol.totalValueLockedUSD = totalValueLocked;
  protocol.totalDepositBalanceUSD = totalValueLocked;
  protocol.save();
  const financialsSnapshot = getOrCreateFinancialsSnapshot(event, protocol);
  financialsSnapshot.save();
}

export function updateProtocolUSDLockedStabilityPool(
  event: ethereum.Event,
  stabilityPoolTVL: BigDecimal
): void {
  const protocol = getOrCreateLiquityProtocol();
  const market = getOrCreateMarket();
  const totalValueLocked = market.totalValueLockedUSD.plus(stabilityPoolTVL);
  protocol.totalValueLockedUSD = totalValueLocked;
  protocol.totalDepositBalanceUSD = totalValueLocked;
  protocol.save();
  const financialsSnapshot = getOrCreateFinancialsSnapshot(event, protocol);
  financialsSnapshot.save();
}

export function updateProtocolBorrowBalance(
  event: ethereum.Event,
  borrowedUSD: BigDecimal,
  totalLUSDSupply: BigInt
): void {
  const protocol = getOrCreateLiquityProtocol();
  protocol.totalBorrowBalanceUSD = borrowedUSD;
  protocol.mintedTokenSupplies = [totalLUSDSupply];
  protocol.save();
  const financialsSnapshot = getOrCreateFinancialsSnapshot(event, protocol);
  financialsSnapshot.save();
}
