// import { log } from "@graphprotocol/graph-ts"
import { Address, ethereum } from "@graphprotocol/graph-ts";
import {
  Token,
  DexAmmProtocol,
  UsageMetricsDailySnapshot,
  FinancialsDailySnapshot,
  LiquidityPoolHourlySnapshot,
  LiquidityPoolDailySnapshot,
  UsageMetricsHourlySnapshot,
  LiquidityPool,
  RewardToken,
} from "../../generated/schema";
import { fetchTokenSymbol, fetchTokenName, fetchTokenDecimals } from "./tokens";
import {
  BIGDECIMAL_ZERO,
  Network,
  INT_ZERO,
  FACTORY_ADDRESS,
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
} from "../common/constants";

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
    let token = getOrCreateToken(address);
    rewardToken = new RewardToken(address.toHexString());
    rewardToken.token = token.id;
    rewardToken.type = RewardTokenType.DEPOSIT;
    rewardToken.save();

    return rewardToken as RewardToken;
  }
  return rewardToken as RewardToken;
}

export function getLiquidityPool(poolAddress: string): LiquidityPool {
  return LiquidityPool.load(poolAddress)!;
}

export function getOrCreateUsageMetricDailySnapshot(event: ethereum.Event): UsageMetricsDailySnapshot {
  // Number of days since Unix epoch
  let id = event.block.timestamp.toI32() / SECONDS_PER_DAY;
  let dayId = id.toString();
  // Create unique id for the day
  let usageMetrics = UsageMetricsDailySnapshot.load(dayId);

  if (!usageMetrics) {
    usageMetrics = new UsageMetricsDailySnapshot(dayId);
    usageMetrics.protocol = FACTORY_ADDRESS;

    usageMetrics.dailyActiveUsers = INT_ZERO;
    usageMetrics.cumulativeUniqueUsers = INT_ZERO;
    usageMetrics.dailyTransactionCount = INT_ZERO;
    usageMetrics.dailyDepositCount = INT_ZERO;
    usageMetrics.dailyWithdrawCount = INT_ZERO;
    usageMetrics.dailySwapCount = INT_ZERO;

    usageMetrics.blockNumber = event.block.number;
    usageMetrics.timestamp = event.block.timestamp;

    usageMetrics.save();
  }

  return usageMetrics;
}
export function getOrCreateUsageMetricHourlySnapshot(event: ethereum.Event): UsageMetricsHourlySnapshot {
  // Number of days since Unix epoch
  let hour = event.block.timestamp.toI32() / SECONDS_PER_HOUR;
  let hourId = hour.toString();

  // Create unique id for the day
  let usageMetrics = UsageMetricsHourlySnapshot.load(hourId);

  if (!usageMetrics) {
    usageMetrics = new UsageMetricsHourlySnapshot(hourId);
    usageMetrics.protocol = FACTORY_ADDRESS;

    usageMetrics.hourlyActiveUsers = INT_ZERO;
    usageMetrics.cumulativeUniqueUsers = INT_ZERO;
    usageMetrics.hourlyTransactionCount = INT_ZERO;
    usageMetrics.hourlyDepositCount = INT_ZERO;
    usageMetrics.hourlyWithdrawCount = INT_ZERO;
    usageMetrics.hourlySwapCount = INT_ZERO;

    usageMetrics.blockNumber = event.block.number;
    usageMetrics.timestamp = event.block.timestamp;

    usageMetrics.save();
  }

  return usageMetrics;
}

export function getOrCreateLiquidityPoolDailySnapshot(event: ethereum.Event): LiquidityPoolDailySnapshot {
  let day = event.block.timestamp.toI32() / SECONDS_PER_DAY;
  let dayId = day.toString();
  let poolMetrics = LiquidityPoolDailySnapshot.load(
    event.address
      .toHexString()
      .concat("-")
      .concat(dayId)
  );

  if (!poolMetrics) {
    poolMetrics = new LiquidityPoolDailySnapshot(
      event.address
        .toHexString()
        .concat("-")
        .concat(dayId)
    );
    poolMetrics.protocol = FACTORY_ADDRESS;
    poolMetrics.pool = event.address.toHexString();
    poolMetrics.totalValueLockedUSD = BIGDECIMAL_ZERO;
    poolMetrics.dailyVolumeUSD = BIGDECIMAL_ZERO;
    poolMetrics.dailyVolumeByTokenAmount = [BIGINT_ZERO, BIGINT_ZERO];
    poolMetrics.dailyVolumeByTokenUSD = [BIGDECIMAL_ZERO, BIGDECIMAL_ZERO];
    poolMetrics.cumulativeVolumeUSD = BIGDECIMAL_ZERO;
    poolMetrics.inputTokenBalances = [BIGINT_ZERO, BIGINT_ZERO];
    poolMetrics.inputTokenWeights = [BIGDECIMAL_ZERO, BIGDECIMAL_ZERO];

    poolMetrics.blockNumber = event.block.number;
    poolMetrics.timestamp = event.block.timestamp;

    poolMetrics.save();
  }

  return poolMetrics;
}

export function getOrCreateLiquidityPoolHourlySnapshot(event: ethereum.Event): LiquidityPoolHourlySnapshot {
  let hour = event.block.timestamp.toI32() / SECONDS_PER_HOUR;

  let hourId = hour.toString();
  let poolMetrics = LiquidityPoolHourlySnapshot.load(
    event.address
      .toHexString()
      .concat("-")
      .concat(hourId)
  );

  if (!poolMetrics) {
    poolMetrics = new LiquidityPoolHourlySnapshot(
      event.address
        .toHexString()
        .concat("-")
        .concat(hourId)
    );
    poolMetrics.protocol = FACTORY_ADDRESS;
    poolMetrics.pool = event.address.toHexString();
    poolMetrics.totalValueLockedUSD = BIGDECIMAL_ZERO;
    poolMetrics.hourlyVolumeUSD = BIGDECIMAL_ZERO;
    poolMetrics.hourlyVolumeByTokenAmount = [BIGINT_ZERO, BIGINT_ZERO];
    poolMetrics.hourlyVolumeByTokenUSD = [BIGDECIMAL_ZERO, BIGDECIMAL_ZERO];
    poolMetrics.cumulativeVolumeUSD = BIGDECIMAL_ZERO;
    poolMetrics.inputTokenBalances = [BIGINT_ZERO, BIGINT_ZERO];
    poolMetrics.inputTokenWeights = [BIGDECIMAL_ZERO, BIGDECIMAL_ZERO];

    poolMetrics.blockNumber = event.block.number;
    poolMetrics.timestamp = event.block.timestamp;

    poolMetrics.save();
  }

  return poolMetrics;
}

export function getOrCreateFinancialsDailySnapshot(event: ethereum.Event): FinancialsDailySnapshot {
  // Number of days since Unix epoch
  let dayID = event.block.timestamp.toI32() / SECONDS_PER_DAY;
  let id = dayID.toString();

  let financialMetrics = FinancialsDailySnapshot.load(id);

  if (!financialMetrics) {
    financialMetrics = new FinancialsDailySnapshot(id);
    financialMetrics.protocol = FACTORY_ADDRESS;

    financialMetrics.totalValueLockedUSD = BIGDECIMAL_ZERO;
    financialMetrics.dailyVolumeUSD = BIGDECIMAL_ZERO;
    financialMetrics.cumulativeVolumeUSD = BIGDECIMAL_ZERO;

    financialMetrics.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
    financialMetrics.dailySupplySideRevenueUSD = BIGDECIMAL_ZERO;
    financialMetrics.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    financialMetrics.dailyProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    financialMetrics.dailyTotalRevenueUSD = BIGDECIMAL_ZERO;
    financialMetrics.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;

    financialMetrics.blockNumber = event.block.number;
    financialMetrics.timestamp = event.block.timestamp;

    financialMetrics.save();
  }
  return financialMetrics;
}

///////////////////////////
///// DexAmm Specific /////
///////////////////////////

export function getOrCreateDex(): DexAmmProtocol {
  let protocol = DexAmmProtocol.load(FACTORY_ADDRESS);

  if (!protocol) {
    protocol = new DexAmmProtocol(FACTORY_ADDRESS);
    protocol.name = PROTOCOL_NAME
    protocol.slug = PROTOCOL_SLUG
    protocol.schemaVersion = PROTOCOL_SCHEMA_VERSION
    protocol.subgraphVersion = PROTOCOL_SUBGRAPH_VERSION
    protocol.methodologyVersion = PROTOCOL_METHODOLOGY_VERSION
    protocol.totalValueLockedUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeVolumeUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeUniqueUsers = INT_ZERO;
    protocol.network = Network.MAINNET;
    protocol.type = ProtocolType.EXCHANGE;

    protocol.save();
  }
  return protocol;
}
