import { Address, BigDecimal, ethereum } from "@graphprotocol/graph-ts";

import { fetchTokenSymbol, fetchTokenName, fetchTokenDecimals } from "./tokens";
import {
  BIGDECIMAL_ZERO,
  Network,
  INT_ZERO,
  ProtocolType,
  SECONDS_PER_DAY,
  BIGINT_ZERO,
  SECONDS_PER_HOUR,
  RewardTokenType,
  USDC_ADDRESS,
  BIGDECIMAL_ONE,
} from "../common/constants";
import { Versions } from "../versions";

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
  _Transfer,
  _LiquidityGauge,
} from "../../generated/schema";

export function getOrCreateToken(tokenAddress: Address): Token {
  const tokenId = tokenAddress.toHexString();
  let token = Token.load(tokenId);
  // fetch info if null
  if (!token) {
    token = new Token(tokenId);
    token.symbol = fetchTokenSymbol(tokenAddress);
    token.name = fetchTokenName(tokenAddress);
    token.decimals = fetchTokenDecimals(tokenAddress);
    token.lastPriceUSD =
      tokenAddress == Address.fromString(USDC_ADDRESS)
        ? BIGDECIMAL_ONE
        : BIGDECIMAL_ZERO;
    token.lastPriceBlockNumber = BIGINT_ZERO;
    token.save();
  }
  return token;
}

export function getOrCreateRewardToken(address: Address): RewardToken {
  const rewardTokenId = RewardTokenType.DEPOSIT.toString()
    .concat("-")
    .concat(address.toHex());
  let rewardToken = RewardToken.load(rewardTokenId);
  if (rewardToken == null) {
    const token = getOrCreateToken(address);
    rewardToken = new RewardToken(rewardTokenId);
    rewardToken.token = token.id;
    rewardToken.type = RewardTokenType.DEPOSIT;
    rewardToken.save();

    return rewardToken as RewardToken;
  }
  return rewardToken as RewardToken;
}

export function getLiquidityPool(poolAddress: Address): LiquidityPool | null {
  return LiquidityPool.load(poolAddress.toHex());
}

export function getOrCreateUsageMetricDailySnapshot(
  protocol: DexAmmProtocol,
  event: ethereum.Event
): UsageMetricsDailySnapshot {
  // Number of days since Unix epoch
  const id = event.block.timestamp.toI32() / SECONDS_PER_DAY;
  const dayId = id.toString();
  // Create unique id for the day
  let usageMetrics = UsageMetricsDailySnapshot.load(dayId);

  if (!usageMetrics) {
    usageMetrics = new UsageMetricsDailySnapshot(dayId);
    usageMetrics.protocol = protocol.id;

    usageMetrics.dailyActiveUsers = INT_ZERO;
    usageMetrics.cumulativeUniqueUsers = INT_ZERO;
    usageMetrics.dailyTransactionCount = INT_ZERO;
    usageMetrics.dailyDepositCount = INT_ZERO;
    usageMetrics.dailyWithdrawCount = INT_ZERO;
    usageMetrics.dailySwapCount = INT_ZERO;
    usageMetrics.totalPoolCount = INT_ZERO;

    usageMetrics.blockNumber = event.block.number;
    usageMetrics.timestamp = event.block.timestamp;

    usageMetrics.save();
  }

  return usageMetrics;
}
export function getOrCreateUsageMetricHourlySnapshot(
  protocol: DexAmmProtocol,
  event: ethereum.Event
): UsageMetricsHourlySnapshot {
  // Number of days since Unix epoch
  const hour = event.block.timestamp.toI32() / SECONDS_PER_HOUR;
  const hourId = hour.toString();

  // Create unique id for the day
  let usageMetrics = UsageMetricsHourlySnapshot.load(hourId);

  if (!usageMetrics) {
    usageMetrics = new UsageMetricsHourlySnapshot(hourId);
    usageMetrics.protocol = protocol.id;

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

export function getOrCreateLiquidityPoolDailySnapshot(
  pool: LiquidityPool,
  block: ethereum.Block
): LiquidityPoolDailySnapshot {
  const day = block.timestamp.toI32() / SECONDS_PER_DAY;
  const dayId = day.toString();
  let poolMetrics = LiquidityPoolDailySnapshot.load(
    pool.id.concat("-").concat(dayId)
  );

  if (!poolMetrics) {
    poolMetrics = new LiquidityPoolDailySnapshot(
      pool.id.concat("-").concat(dayId)
    );
    poolMetrics.protocol = pool.protocol;
    poolMetrics.pool = pool.id;
    poolMetrics.blockNumber = block.number;
    poolMetrics.timestamp = block.timestamp;

    poolMetrics.totalValueLockedUSD = pool.totalValueLockedUSD;
    poolMetrics.cumulativeSupplySideRevenueUSD =
      pool.cumulativeSupplySideRevenueUSD;
    poolMetrics.dailySupplySideRevenueUSD = BIGDECIMAL_ZERO;
    poolMetrics.cumulativeProtocolSideRevenueUSD =
      pool.cumulativeProtocolSideRevenueUSD;
    poolMetrics.dailyProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    poolMetrics.cumulativeTotalRevenueUSD = pool.cumulativeTotalRevenueUSD;
    poolMetrics.dailyTotalRevenueUSD = BIGDECIMAL_ZERO;
    poolMetrics.dailyVolumeUSD = BIGDECIMAL_ZERO;
    poolMetrics.dailyVolumeByTokenAmount = [BIGINT_ZERO, BIGINT_ZERO];
    poolMetrics.dailyVolumeByTokenUSD = [BIGDECIMAL_ZERO, BIGDECIMAL_ZERO];
    poolMetrics.cumulativeVolumeUSD = pool.cumulativeVolumeUSD;
    poolMetrics.inputTokenBalances = pool.inputTokenBalances;
    poolMetrics.inputTokenWeights = pool.inputTokenWeights;
    // poolMetrics.outputTokenSupply = pool.outputTokenSupply
    // poolMetrics.outputTokenPriceUSD = pool.outputTokenPriceUSD

    poolMetrics.save();
  }

  return poolMetrics;
}

export function getOrCreateLiquidityPoolHourlySnapshot(
  pool: LiquidityPool,
  block: ethereum.Block
): LiquidityPoolHourlySnapshot {
  const hour = block.timestamp.toI32() / SECONDS_PER_HOUR;

  const hourId = hour.toString();
  let poolMetrics = LiquidityPoolHourlySnapshot.load(
    pool.id.concat("-").concat(hourId)
  );

  if (!poolMetrics) {
    poolMetrics = new LiquidityPoolHourlySnapshot(
      pool.id.concat("-").concat(hourId)
    );
    poolMetrics.protocol = pool.protocol;
    poolMetrics.pool = pool.id;
    poolMetrics.blockNumber = block.number;
    poolMetrics.timestamp = block.timestamp;

    poolMetrics.totalValueLockedUSD = pool.totalValueLockedUSD;
    poolMetrics.cumulativeSupplySideRevenueUSD =
      pool.cumulativeSupplySideRevenueUSD;
    poolMetrics.hourlySupplySideRevenueUSD = BIGDECIMAL_ZERO;
    poolMetrics.cumulativeProtocolSideRevenueUSD =
      pool.cumulativeProtocolSideRevenueUSD;
    poolMetrics.hourlyProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    poolMetrics.cumulativeTotalRevenueUSD = pool.cumulativeTotalRevenueUSD;
    poolMetrics.hourlyTotalRevenueUSD = BIGDECIMAL_ZERO;
    poolMetrics.hourlyVolumeUSD = BIGDECIMAL_ZERO;
    poolMetrics.hourlyVolumeByTokenAmount = [BIGINT_ZERO, BIGINT_ZERO];
    poolMetrics.hourlyVolumeByTokenUSD = [BIGDECIMAL_ZERO, BIGDECIMAL_ZERO];
    poolMetrics.cumulativeVolumeUSD = pool.cumulativeVolumeUSD;
    poolMetrics.inputTokenBalances = pool.inputTokenBalances;
    poolMetrics.inputTokenWeights = pool.inputTokenWeights;
    // poolMetrics.outputTokenSupply = pool.outputTokenSupply
    // poolMetrics.outputTokenPriceUSD = pool.outputTokenPriceUSD

    poolMetrics.blockNumber = block.number;
    poolMetrics.timestamp = block.timestamp;

    poolMetrics.save();
  }

  return poolMetrics;
}

export function getOrCreateFinancialsDailySnapshot(
  protocol: DexAmmProtocol,
  event: ethereum.Event
): FinancialsDailySnapshot {
  // Number of days since Unix epoch
  const dayID = event.block.timestamp.toI32() / SECONDS_PER_DAY;
  const id = dayID.toString();

  let financialMetrics = FinancialsDailySnapshot.load(id);

  if (!financialMetrics) {
    financialMetrics = new FinancialsDailySnapshot(id);
    financialMetrics.protocol = protocol.id;

    financialMetrics.totalValueLockedUSD = protocol.totalValueLockedUSD;
    financialMetrics.dailyVolumeUSD = BIGDECIMAL_ZERO;
    financialMetrics.cumulativeVolumeUSD = protocol.cumulativeVolumeUSD;

    financialMetrics.dailySupplySideRevenueUSD = BIGDECIMAL_ZERO;
    financialMetrics.dailyProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    financialMetrics.dailyTotalRevenueUSD = BIGDECIMAL_ZERO;
    financialMetrics.cumulativeSupplySideRevenueUSD =
      protocol.cumulativeSupplySideRevenueUSD;
    financialMetrics.cumulativeProtocolSideRevenueUSD =
      protocol.cumulativeProtocolSideRevenueUSD;
    financialMetrics.cumulativeTotalRevenueUSD =
      protocol.cumulativeTotalRevenueUSD;

    financialMetrics.blockNumber = event.block.number;
    financialMetrics.timestamp = event.block.timestamp;

    financialMetrics.save();
  }
  return financialMetrics;
}

///////////////////////////
///// DexAmm Specific /////
///////////////////////////

export function getOrCreateDex(
  protocolId: string,
  protocolName: string,
  protocolSlug: string
): DexAmmProtocol {
  let protocol = DexAmmProtocol.load(protocolId);

  if (!protocol) {
    protocol = new DexAmmProtocol(protocolId);
    protocol.name = protocolName;
    protocol.slug = protocolSlug;
    protocol.network = Network.OPTIMISM; // Need to change this
    protocol.type = ProtocolType.EXCHANGE;
    protocol.totalValueLockedUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeVolumeUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeUniqueUsers = INT_ZERO;
    protocol.totalPoolCount = INT_ZERO;
    protocol._stableFee = BigDecimal.fromString("0.02"); // Value hardcoded in factory constructor
    protocol._volatileFee = BigDecimal.fromString("0.02"); // Value hardcoded in factory constructor
    protocol._stablePools = [];
    protocol._volatilePools = [];
    protocol._lastFeeCheckBlockNumber = BIGINT_ZERO;
  }

  protocol.schemaVersion = Versions.getSchemaVersion();
  protocol.subgraphVersion = Versions.getSubgraphVersion();
  protocol.methodologyVersion = Versions.getMethodologyVersion();

  protocol.save();

  return protocol;
}

export function getDaysSinceEpoch(secondsSinceEpoch: number): string {
  return (<i32>Math.floor(secondsSinceEpoch / SECONDS_PER_DAY)).toString();
}

export function getOrCreateTransfer(event: ethereum.Event): _Transfer {
  let transfer = _Transfer.load(event.transaction.hash.toHexString());
  if (!transfer) {
    transfer = new _Transfer(event.transaction.hash.toHexString());
    transfer.blockNumber = event.block.number;
    transfer.timestamp = event.block.timestamp;
  }
  transfer.save();
  return transfer;
}

export function getLiquidityGauge(
  gaugeAddress: Address
): _LiquidityGauge | null {
  return _LiquidityGauge.load(gaugeAddress.toHex());
}
