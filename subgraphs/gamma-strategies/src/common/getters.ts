// import { log } from "@graphprotocol/graph-ts"
import {
  Address,
  BigDecimal,
  dataSource,
  ethereum,
} from "@graphprotocol/graph-ts";
import {
  Token,
  UsageMetricsDailySnapshot,
  FinancialsDailySnapshot,
  UsageMetricsHourlySnapshot,
  YieldAggregator,
  VaultDailySnapshot,
  VaultHourlySnapshot,
} from "../../generated/schema";
import { fetchTokenSymbol, fetchTokenName, fetchTokenDecimals } from "./tokens";
import {
  BIGDECIMAL_ZERO,
  INT_ZERO,
  ProtocolType,
  SECONDS_PER_DAY,
  BIGINT_ZERO,
  SECONDS_PER_HOUR,
  PROTOCOL_NAME,
  PROTOCOL_SLUG,
  PROTOCOL_SCHEMA_VERSION,
  PROTOCOL_SUBGRAPH_VERSION,
  PROTOCOL_METHODOLOGY_VERSION,
  REGISTRY_ADDRESS_MAP,
} from "../common/constants";
import { getDaysSinceEpoch, getHoursSinceEpoch } from "./utils/datetime";

export function getOrCreateToken(tokenAddress: Address): Token {
  let token = Token.load(tokenAddress.toHexString());
  // fetch info if null
  if (!token) {
    token = new Token(tokenAddress.toHexString());
    token.symbol = fetchTokenSymbol(tokenAddress);
    token.name = fetchTokenName(tokenAddress);
    token.decimals = fetchTokenDecimals(tokenAddress);
    token.lastPriceUSD = BIGDECIMAL_ZERO;
    token.lastPriceBlockNumber = BIGINT_ZERO;
    token.save();
  }
  return token;
}

export function getOrCreateUsageMetricDailySnapshot(
  event: ethereum.Event
): UsageMetricsDailySnapshot {
  // Number of days since Unix epoch
  let id = event.block.timestamp.toI32() / SECONDS_PER_DAY;
  let dayId = id.toString();
  // Create unique id for the day
  let usageMetrics = UsageMetricsDailySnapshot.load(dayId);

  if (!usageMetrics) {
    usageMetrics = new UsageMetricsDailySnapshot(dayId);
    usageMetrics.protocol = REGISTRY_ADDRESS_MAP.get(
      dataSource.network()
    )!.toHex();

    usageMetrics.dailyActiveUsers = INT_ZERO;
    usageMetrics.cumulativeUniqueUsers = INT_ZERO;
    usageMetrics.dailyTransactionCount = INT_ZERO;
    usageMetrics.dailyDepositCount = INT_ZERO;
    usageMetrics.dailyWithdrawCount = INT_ZERO;

    usageMetrics.blockNumber = event.block.number;
    usageMetrics.timestamp = event.block.timestamp;

    usageMetrics.save();
  }

  return usageMetrics;
}

export function getOrCreateUsageMetricHourlySnapshot(
  event: ethereum.Event
): UsageMetricsHourlySnapshot {
  // Number of days since Unix epoch
  let hour = event.block.timestamp.toI32() / SECONDS_PER_HOUR;
  let hourId = hour.toString();

  // Create unique id for the day
  let usageMetrics = UsageMetricsHourlySnapshot.load(hourId);

  if (!usageMetrics) {
    usageMetrics = new UsageMetricsHourlySnapshot(hourId);
    usageMetrics.protocol = REGISTRY_ADDRESS_MAP.get(
      dataSource.network()
    )!.toHex();

    usageMetrics.hourlyActiveUsers = INT_ZERO;
    usageMetrics.cumulativeUniqueUsers = INT_ZERO;
    usageMetrics.hourlyTransactionCount = INT_ZERO;
    usageMetrics.hourlyDepositCount = INT_ZERO;
    usageMetrics.hourlyWithdrawCount = INT_ZERO;

    usageMetrics.blockNumber = event.block.number;
    usageMetrics.timestamp = event.block.timestamp;

    usageMetrics.save();
  }

  return usageMetrics;
}

export function getOrCreateFinancialsDailySnapshot(
  event: ethereum.Event
): FinancialsDailySnapshot {
  // Number of days since Unix epoch
  let dayID = event.block.timestamp.toI32() / SECONDS_PER_DAY;
  let id = dayID.toString();

  let financialMetrics = FinancialsDailySnapshot.load(id);

  if (!financialMetrics) {
    let protocol = getOrCreateYieldAggregator(
      REGISTRY_ADDRESS_MAP.get(dataSource.network())!
    );
    financialMetrics = new FinancialsDailySnapshot(id);
    financialMetrics.protocol = protocol.id;

    financialMetrics.totalValueLockedUSD = BIGDECIMAL_ZERO;
    financialMetrics.protocolControlledValueUSD = null

    financialMetrics.cumulativeSupplySideRevenueUSD =
      protocol.cumulativeSupplySideRevenueUSD;
    financialMetrics.dailySupplySideRevenueUSD = BIGDECIMAL_ZERO;
    financialMetrics.cumulativeProtocolSideRevenueUSD =
      protocol.cumulativeProtocolSideRevenueUSD;
    financialMetrics.dailyProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    financialMetrics.dailyTotalRevenueUSD = BIGDECIMAL_ZERO;
    financialMetrics.cumulativeTotalRevenueUSD =
      protocol.cumulativeTotalRevenueUSD;

    financialMetrics.blockNumber = event.block.number;
    financialMetrics.timestamp = event.block.timestamp;

    financialMetrics.save();
  }
  return financialMetrics;
}

export function getOrCreateVaultDailySnapshot(
  event: ethereum.Event
): VaultDailySnapshot {
  const snapshotId = event.address
    .toHex()
    .concat("-")
    .concat(getDaysSinceEpoch(event.block.timestamp.toI32()));

  let snapshot = VaultDailySnapshot.load(snapshotId);
  if (!snapshot) {
    snapshot = new VaultDailySnapshot(snapshotId);
    snapshot.protocol = REGISTRY_ADDRESS_MAP.get(dataSource.network())!.toHex();
    snapshot.vault = event.address.toHex();
    snapshot.totalValueLockedUSD = BigDecimal.zero();
    snapshot.inputTokenBalance = BIGINT_ZERO;
    snapshot.outputTokenSupply = BIGINT_ZERO;
    snapshot.outputTokenPriceUSD = BigDecimal.zero();
    snapshot.pricePerShare = null;
    snapshot.stakedOutputTokenAmount = null;
    snapshot.rewardTokenEmissionsAmount = null;
    snapshot.rewardTokenEmissionsUSD = null;
    snapshot.blockNumber = event.block.number;
    snapshot.timestamp = event.block.timestamp;
    snapshot.save();
  }

  return snapshot;
}

export function getOrCreateVaultHourlySnapshot(
  event: ethereum.Event
): VaultHourlySnapshot {
  const snapshotId = event.address
    .toHex()
    .concat("-")
    .concat(getHoursSinceEpoch(event.block.timestamp.toI32()));

  let snapshot = VaultHourlySnapshot.load(snapshotId);
  if (!snapshot) {
    snapshot = new VaultHourlySnapshot(snapshotId);
    snapshot.protocol = REGISTRY_ADDRESS_MAP.get(dataSource.network())!.toHex();
    snapshot.vault = event.address.toHex();
    snapshot.totalValueLockedUSD = BigDecimal.zero();
    snapshot.inputTokenBalance = BIGINT_ZERO;
    snapshot.outputTokenSupply = BIGINT_ZERO;
    snapshot.outputTokenPriceUSD = BigDecimal.zero();
    snapshot.pricePerShare = null;
    snapshot.stakedOutputTokenAmount = null;
    snapshot.rewardTokenEmissionsAmount = null;
    snapshot.rewardTokenEmissionsUSD = null;
    snapshot.blockNumber = event.block.number;
    snapshot.timestamp = event.block.timestamp;
    snapshot.save();
  }

  return snapshot;
}

//////////////////////////
///// Yield Specific /////
//////////////////////////

export function getOrCreateYieldAggregator(
  registryAddress: Address
): YieldAggregator {
  let registryId = registryAddress.toHexString();
  let protocol = YieldAggregator.load(registryId);

  if (!protocol) {
    protocol = new YieldAggregator(registryId);
    protocol.name = PROTOCOL_NAME;
    protocol.slug = PROTOCOL_SLUG;
    protocol.schemaVersion = PROTOCOL_SCHEMA_VERSION;
    protocol.subgraphVersion = PROTOCOL_SUBGRAPH_VERSION;
    protocol.methodologyVersion = PROTOCOL_METHODOLOGY_VERSION;
    protocol.network = dataSource.network().toUpperCase().replace("-", "_");
    protocol.type = ProtocolType.YIELD;
    protocol.totalValueLockedUSD = BigDecimal.zero();
    protocol.protocolControlledValueUSD = null;
    protocol.cumulativeSupplySideRevenueUSD = BigDecimal.zero();
    protocol.cumulativeProtocolSideRevenueUSD = BigDecimal.zero();
    protocol.cumulativeTotalRevenueUSD = BigDecimal.zero();
    protocol.cumulativeUniqueUsers = INT_ZERO;
    protocol.save();
  }
  return protocol;
}
