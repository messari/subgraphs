import { Address, BigDecimal, ethereum } from "@graphprotocol/graph-ts";
import {
  FinancialsDailySnapshot,
  LendingProtocol,
  UsageMetricsDailySnapshot,
  DailyActiveAccount,
  Account,
} from "../../generated/schema";
import {
  LendingType,
  Network,
  ProtocolType,
  RiskType,
  SECONDS_PER_DAY,
  TROVE_MANAGER,
} from "../utils/constants";
import { getOrCreateMarket } from "./market";

export function getOrCreateLiquityProtocol(): LendingProtocol {
  let protocol = LendingProtocol.load(TROVE_MANAGER);
  if (!protocol) {
    protocol = new LendingProtocol(TROVE_MANAGER);
    protocol.name = "Liquity";
    protocol.slug = "liquity";
    protocol.schemaVersion = "1.1.0";
    protocol.subgraphVersion = "1.0.0";
    protocol.methodologyVersion = "1.0.0";
    protocol.network = Network.ETHEREUM;
    protocol.type = ProtocolType.LENDING;
    protocol.lendingType = LendingType.CDP;
    protocol.riskType = RiskType.ISOLATED;
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
    usageMetrics.totalUniqueUsers = protocol.totalUniqueUsers;
  }
  usageMetrics.blockNumber = event.block.number;
  usageMetrics.timestamp = event.block.timestamp;
  return usageMetrics;
}

export function getOrCreateFinancialsSnapshot(
  event: ethereum.Event
): FinancialsDailySnapshot {
  // Number of days since Unix epoch
  const id = `${event.block.timestamp.toI64() / SECONDS_PER_DAY}`;
  let financialsSnapshot = FinancialsDailySnapshot.load(id);
  if (!financialsSnapshot) {
    financialsSnapshot = new FinancialsDailySnapshot(id);
    financialsSnapshot.protocol = getOrCreateLiquityProtocol().id;
  }
  financialsSnapshot.blockNumber = event.block.number;
  financialsSnapshot.timestamp = event.block.timestamp;
  return financialsSnapshot;
}

// Keep track of daily transaction count and daily/total unique users
export function updateUsageMetrics(event: ethereum.Event, from: Address): void {
  // Number of days since Unix epoch
  const days = `${event.block.timestamp.toI64() / SECONDS_PER_DAY}`;
  const usageMetrics = getOrCreateUsageMetricsSnapshot(event);
  usageMetrics.dailyTransactionCount += 1;

  let accountId = from.toHexString();
  let account = Account.load(accountId);
  if (!account) {
    account = new Account(accountId);
    account.save();
    const protocol = getOrCreateLiquityProtocol();
    protocol.totalUniqueUsers += 1;
    protocol.save();
    usageMetrics.totalUniqueUsers += 1;
  }

  // Combine the id and the user address to generate a unique user id for the day
  let dailyActiveAccountId = `${days.toString()}-${accountId}`;
  let dailyActiveAccount = DailyActiveAccount.load(dailyActiveAccountId);
  if (!dailyActiveAccount) {
    dailyActiveAccount = new DailyActiveAccount(dailyActiveAccountId);
    dailyActiveAccount.save();
    usageMetrics.activeUsers += 1;
  }
  usageMetrics.save();
}

export function addProtocolSideRevenue(
  event: ethereum.Event,
  revenueAmountUSD: BigDecimal
): void {
  const financialsSnapshot = getOrCreateFinancialsSnapshot(event);
  financialsSnapshot.totalRevenueUSD =
    financialsSnapshot.totalRevenueUSD.plus(revenueAmountUSD);
  financialsSnapshot.protocolSideRevenueUSD =
    financialsSnapshot.protocolSideRevenueUSD.plus(revenueAmountUSD);
  financialsSnapshot.save();
}

export function addSupplySideRevenue(
  event: ethereum.Event,
  revenueAmountUSD: BigDecimal
): void {
  const financialsSnapshot = getOrCreateFinancialsSnapshot(event);
  financialsSnapshot.totalRevenueUSD =
    financialsSnapshot.totalRevenueUSD.plus(revenueAmountUSD);
  financialsSnapshot.supplySideRevenueUSD =
    financialsSnapshot.supplySideRevenueUSD.plus(revenueAmountUSD);
  financialsSnapshot.save();
}

export function addUSDVolume(
  event: ethereum.Event,
  volumeUSD: BigDecimal
): void {
  const protocol = getOrCreateLiquityProtocol();
  protocol.totalVolumeUSD = protocol.totalVolumeUSD.plus(volumeUSD);
  protocol.save();
  const financialsSnapshot = getOrCreateFinancialsSnapshot(event);
  financialsSnapshot.totalVolumeUSD =
    financialsSnapshot.totalVolumeUSD.plus(volumeUSD);
  financialsSnapshot.save();
}

export function updateUSDLocked(
  event: ethereum.Event,
  netChangeUSD: BigDecimal
): void {
  const protocol = getOrCreateLiquityProtocol();
  const totalValueLocked = protocol.totalValueLockedUSD.plus(netChangeUSD);
  protocol.totalValueLockedUSD = totalValueLocked;
  protocol.totalDepositUSD = totalValueLocked;
  protocol.save();
  const financialsSnapshot = getOrCreateFinancialsSnapshot(event);
  financialsSnapshot.totalValueLockedUSD = totalValueLocked;
  financialsSnapshot.totalDepositUSD = totalValueLocked;
  financialsSnapshot.save();
}

export function updateUSDLockedStabilityPool(
  event: ethereum.Event,
  stabilityPoolTVL: BigDecimal
): void {
  const protocol = getOrCreateLiquityProtocol();
  const market = getOrCreateMarket();
  const totalValueLocked = market.totalValueLockedUSD.plus(stabilityPoolTVL);
  protocol.totalValueLockedUSD = totalValueLocked;
  protocol.totalDepositUSD = totalValueLocked;
  protocol.save();
  const financialsSnapshot = getOrCreateFinancialsSnapshot(event);
  financialsSnapshot.totalValueLockedUSD = totalValueLocked;
  financialsSnapshot.totalDepositUSD = totalValueLocked;
  financialsSnapshot.save();
}

export function updateUSDBorrowed(
  event: ethereum.Event,
  borrowedUSD: BigDecimal
): void {
  const protocol = getOrCreateLiquityProtocol();
  protocol.totalBorrowUSD = borrowedUSD;
  protocol.save();
  const financialsSnapshot = getOrCreateFinancialsSnapshot(event);
  financialsSnapshot.totalBorrowUSD = borrowedUSD;
  financialsSnapshot.save();
}
