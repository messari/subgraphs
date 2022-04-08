import { Address, BigDecimal, ethereum } from "@graphprotocol/graph-ts";
import {
  FinancialsDailySnapshot,
  LendingProtocol,
  UsageMetricsDailySnapshot,
  _DailyActiveAccount,
} from "../../generated/schema";
import {
  LendingType,
  Network,
  ProtocolType,
  RiskType,
  SECONDS_PER_DAY,
  TROVE_MANAGER,
} from "../utils/constants";

export function getOrCreateLiquityProtocol(): LendingProtocol {
  let protocol = LendingProtocol.load(TROVE_MANAGER);
  if (!protocol) {
    protocol = new LendingProtocol(TROVE_MANAGER);
    protocol.name = "Liquity";
    protocol.slug = "liquity";
    protocol.schemaVersion = "1.0.0";
    protocol.subgraphVersion = "1.0.0";
    protocol.network = Network.ETHEREUM;
    protocol.type = ProtocolType.LENDING;
    protocol.lendingType = LendingType.CDP;
    protocol.riskType = RiskType.ISOLATED;
    protocol.save();
  }
  return protocol;
}

export function getOrCreateUsageMetricSnapshot(
  event: ethereum.Event
): UsageMetricsDailySnapshot {
  // Number of days since Unix epoch
  const id = `${event.block.timestamp.toI64() / SECONDS_PER_DAY}`;
  let usageMetrics = UsageMetricsDailySnapshot.load(id);
  if (!usageMetrics) {
    usageMetrics = new UsageMetricsDailySnapshot(id);
    usageMetrics.protocol = getOrCreateLiquityProtocol().id;
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

export function incrementProtocolUniqueUsers(): void {
  const protocol = getOrCreateLiquityProtocol();
  protocol.totalUniqueUsers += 1;
  protocol.save();
}

export function updateUsageMetrics(event: ethereum.Event, from: Address): void {
  // Number of days since Unix epoch
  const id: i64 = event.block.timestamp.toI64() / SECONDS_PER_DAY;
  const usageMetrics = getOrCreateUsageMetricSnapshot(event);
  const protocol = getOrCreateLiquityProtocol();
  usageMetrics.dailyTransactionCount += 1;
  usageMetrics.totalUniqueUsers = protocol.totalUniqueUsers;

  // Combine the id and the user address to generate a unique user id for the day
  let dailyActiveAccountId = `${id.toString()}-${from.toHexString()}`;
  let dailyActiveAccount = _DailyActiveAccount.load(dailyActiveAccountId);
  if (!dailyActiveAccount) {
    dailyActiveAccount = new _DailyActiveAccount(dailyActiveAccountId);
    dailyActiveAccount.save();
    usageMetrics.activeUsers += 1;
  }
  usageMetrics.save();
}

export function addUSDFees(
  event: ethereum.Event,
  feeAmountUSD: BigDecimal
): void {
  const financialsSnapshot = getOrCreateFinancialsSnapshot(event);
  financialsSnapshot.feesUSD = financialsSnapshot.feesUSD.plus(feeAmountUSD);
  financialsSnapshot.supplySideRevenueUSD =
    financialsSnapshot.supplySideRevenueUSD.plus(feeAmountUSD);
  financialsSnapshot.save();
}

export function addUSDVolume(
  event: ethereum.Event,
  volumeUSD: BigDecimal
): void {
  const financialsSnapshot = getOrCreateFinancialsSnapshot(event);
  financialsSnapshot.totalVolumeUSD =
    financialsSnapshot.totalVolumeUSD.plus(volumeUSD);
  financialsSnapshot.save();
}

export function updateUSDLocked(
  event: ethereum.Event,
  lockedUSD: BigDecimal
): void {
  const protocol = getOrCreateLiquityProtocol();
  protocol.totalValueLockedUSD = lockedUSD;
  protocol.save();
  const financialsSnapshot = getOrCreateFinancialsSnapshot(event);
  financialsSnapshot.totalValueLockedUSD = lockedUSD;
  financialsSnapshot.save();
}
