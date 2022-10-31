// import { log } from "@graphprotocol/graph-ts"
import { Address, dataSource, ethereum } from "@graphprotocol/graph-ts";
import {
  Token,
  UsageMetricsDailySnapshot,
  FinancialsDailySnapshot,
  UsageMetricsHourlySnapshot,
  RewardToken,
  Protocol,
  Pool,
  PoolDailySnapshot,
  PoolHourlySnapshot,
} from "../../generated/schema";
import { fetchTokenSymbol, fetchTokenName, fetchTokenDecimals } from "./tokens";
import {
  BIGDECIMAL_ZERO,
  INT_ZERO,
  ProtocolType,
  SECONDS_PER_DAY,
  BIGINT_ZERO,
  SECONDS_PER_HOUR,
  RewardTokenType,
  PROTOCOL_NAME,
  PROTOCOL_SLUG,
  PROTOCOL_SCHEMA_VERSION,
  PROTOCOL_SUBGRAPH_VERSION,
  PROTOCOL_METHODOLOGY_VERSION,
  PROTOCOL_ADDRESS_MAP,
  GLP_ADDRESS_MAP,
} from "../common/constants";

export function getOrCreateProtocol(): Protocol {
  const network = dataSource.network();
  const protocolId = PROTOCOL_ADDRESS_MAP.get(network)!.toHex();
  let protocol = Protocol.load(protocolId);
  if (!protocol) {
    protocol = new Protocol(protocolId);
    protocol.name = PROTOCOL_NAME;
    protocol.slug = PROTOCOL_SLUG;
    protocol.schemaVersion = PROTOCOL_SCHEMA_VERSION;
    protocol.subgraphVersion = PROTOCOL_SUBGRAPH_VERSION;
    protocol.methodologyVersion = PROTOCOL_METHODOLOGY_VERSION;
    protocol.network = network.toUpperCase().replace("-", "_");
    protocol.type = ProtocolType.GENERIC;
    protocol.totalValueLockedUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeUniqueUsers = INT_ZERO;
    protocol.totalPoolCount = INT_ZERO;
    protocol.save();
  }
  return protocol;
}

export function getOrCreatePool(
  poolAddress: Address,
  block: ethereum.Block
): Pool {
  const poolId = poolAddress.toHex();
  let pool = Pool.load(poolId);
  if (!pool) {
    const protocol = getOrCreateProtocol();
    protocol.totalPoolCount += 1;

    const usageMetricsDailySnapshot =
      getOrCreateUsageMetricDailySnapshot(block);
    usageMetricsDailySnapshot.totalPoolCount = protocol.totalPoolCount;

    const token = getOrCreateToken(poolAddress);
    const glpToken = getOrCreateToken(
      GLP_ADDRESS_MAP.get(dataSource.network())!
    );
    pool = new Pool(poolId);
    pool.protocol = protocol.id;
    pool.name = token.name;
    pool.symbol = token.symbol;
    pool.inputTokens = [poolId];
    pool.outputToken = glpToken.id;
    pool.createdTimestamp = block.timestamp;
    pool.createdBlockNumber = block.number;
    pool.totalValueLockedUSD = BIGDECIMAL_ZERO;
    pool.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
    pool.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    pool.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;
    pool.inputTokenBalances = [BIGINT_ZERO];
    pool.outputTokenSupply = BIGINT_ZERO;

    protocol.save();
    usageMetricsDailySnapshot.save();
    pool.save();
  }
  return pool;
}

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

export function getOrCreateRewardToken(address: Address): RewardToken {
  let rewardToken = RewardToken.load(address.toHexString());
  if (rewardToken == null) {
    const token = getOrCreateToken(address);
    rewardToken = new RewardToken(address.toHexString());
    rewardToken.token = token.id;
    rewardToken.type = RewardTokenType.DEPOSIT;
    rewardToken.save();

    return rewardToken as RewardToken;
  }
  return rewardToken as RewardToken;
}

export function getOrCreateUsageMetricDailySnapshot(
  block: ethereum.Block
): UsageMetricsDailySnapshot {
  // Number of days since Unix epoch
  const id = block.timestamp.toI32() / SECONDS_PER_DAY;
  const dayId = id.toString();
  // Create unique id for the day
  let usageMetrics = UsageMetricsDailySnapshot.load(dayId);

  if (!usageMetrics) {
    const protocol = getOrCreateProtocol();
    usageMetrics = new UsageMetricsDailySnapshot(dayId);
    usageMetrics.protocol = protocol.id;
    usageMetrics.dailyActiveUsers = INT_ZERO;
    usageMetrics.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers;
    usageMetrics.dailyTransactionCount = INT_ZERO;
    usageMetrics.totalPoolCount = protocol.totalPoolCount;

    usageMetrics.blockNumber = block.number;
    usageMetrics.timestamp = block.timestamp;

    usageMetrics.save();
  }

  return usageMetrics;
}
export function getOrCreateUsageMetricHourlySnapshot(
  block: ethereum.Block
): UsageMetricsHourlySnapshot {
  // Number of days since Unix epoch
  const hour = block.timestamp.toI32() / SECONDS_PER_HOUR;
  const hourId = hour.toString();

  // Create unique id for the day
  let usageMetrics = UsageMetricsHourlySnapshot.load(hourId);

  if (!usageMetrics) {
    const protocol = getOrCreateProtocol();
    usageMetrics = new UsageMetricsHourlySnapshot(hourId);
    usageMetrics.protocol = protocol.id;
    usageMetrics.hourlyActiveUsers = INT_ZERO;
    usageMetrics.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers;
    usageMetrics.hourlyTransactionCount = INT_ZERO;

    usageMetrics.blockNumber = block.number;
    usageMetrics.timestamp = block.timestamp;

    usageMetrics.save();
  }

  return usageMetrics;
}

export function getOrCreateFinancialsDailySnapshot(
  block: ethereum.Block
): FinancialsDailySnapshot {
  // Number of days since Unix epoch
  const dayID = block.timestamp.toI32() / SECONDS_PER_DAY;
  const id = dayID.toString();

  let financialMetrics = FinancialsDailySnapshot.load(id);

  if (!financialMetrics) {
    const protocol = getOrCreateProtocol();
    financialMetrics = new FinancialsDailySnapshot(id);
    financialMetrics.protocol = protocol.id;

    financialMetrics.totalValueLockedUSD = protocol.totalValueLockedUSD;

    financialMetrics.dailySupplySideRevenueUSD = BIGDECIMAL_ZERO;
    financialMetrics.cumulativeSupplySideRevenueUSD =
      protocol.cumulativeSupplySideRevenueUSD;
    financialMetrics.dailyProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    financialMetrics.cumulativeProtocolSideRevenueUSD =
      protocol.cumulativeProtocolSideRevenueUSD;
    financialMetrics.dailyTotalRevenueUSD = BIGDECIMAL_ZERO;
    financialMetrics.cumulativeTotalRevenueUSD =
      protocol.cumulativeTotalRevenueUSD;

    financialMetrics.blockNumber = block.number;
    financialMetrics.timestamp = block.timestamp;

    financialMetrics.save();
  }
  return financialMetrics;
}

export function getOrCreatePoolDailySnapshot(
  poolAddress: Address,
  block: ethereum.Block
): PoolDailySnapshot {
  // Number of days since Unix epoch
  const id = block.timestamp.toI32() / SECONDS_PER_DAY;
  const snapshotId = poolAddress.toHex().concat("-").concat(id.toString());
  // Create unique id for the day
  let snapshot = PoolDailySnapshot.load(snapshotId);

  if (!snapshot) {
    const protocol = getOrCreateProtocol();
    const pool = getOrCreatePool(poolAddress, block);
    snapshot = new PoolDailySnapshot(snapshotId);
    snapshot.protocol = protocol.id;
    snapshot.pool = poolAddress.toHex();
    snapshot.totalValueLockedUSD = pool.totalValueLockedUSD;
    snapshot.cumulativeSupplySideRevenueUSD =
      pool.cumulativeSupplySideRevenueUSD;
    snapshot.dailySupplySideRevenueUSD = BIGDECIMAL_ZERO;
    snapshot.cumulativeProtocolSideRevenueUSD =
      pool.cumulativeProtocolSideRevenueUSD;
    snapshot.dailyProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    snapshot.cumulativeTotalRevenueUSD = pool.cumulativeTotalRevenueUSD;
    snapshot.dailyTotalRevenueUSD = BIGDECIMAL_ZERO;
    snapshot.inputTokenBalances = pool.inputTokenBalances;
    snapshot.outputTokenSupply = pool.outputTokenSupply;

    snapshot.blockNumber = block.number;
    snapshot.timestamp = block.timestamp;

    snapshot.save();
  }

  return snapshot;
}

export function getOrCreatePoolHourlySnapshot(
  poolAddress: Address,
  block: ethereum.Block
): PoolHourlySnapshot {
  // Number of days since Unix epoch
  const hour = block.timestamp.toI32() / SECONDS_PER_HOUR;
  const snapshotId = poolAddress.toHex().concat("-").concat(hour.toString());
  // Create unique id for the day
  let snapshot = PoolHourlySnapshot.load(snapshotId);

  if (!snapshot) {
    const protocol = getOrCreateProtocol();
    const pool = getOrCreatePool(poolAddress, block);
    snapshot = new PoolHourlySnapshot(snapshotId);
    snapshot.protocol = protocol.id;
    snapshot.pool = poolAddress.toHex();
    snapshot.totalValueLockedUSD = pool.totalValueLockedUSD;
    snapshot.cumulativeSupplySideRevenueUSD =
      pool.cumulativeSupplySideRevenueUSD;
    snapshot.hourlySupplySideRevenueUSD = BIGDECIMAL_ZERO;
    snapshot.cumulativeProtocolSideRevenueUSD =
      pool.cumulativeProtocolSideRevenueUSD;
    snapshot.hourlyProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    snapshot.cumulativeTotalRevenueUSD = pool.cumulativeTotalRevenueUSD;
    snapshot.hourlyTotalRevenueUSD = BIGDECIMAL_ZERO;
    snapshot.inputTokenBalances = pool.inputTokenBalances;
    snapshot.outputTokenSupply = pool.outputTokenSupply;

    snapshot.blockNumber = block.number;
    snapshot.timestamp = block.timestamp;

    snapshot.save();
  }

  return snapshot;
}
