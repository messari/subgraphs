import { Address, ethereum, BigInt, BigDecimal, log } from "@graphprotocol/graph-ts";
import {
  Token,
  DexAmmProtocol,
  UsageMetricsHourlySnapshot,
  UsageMetricsDailySnapshot,
  FinancialsDailySnapshot,
  LiquidityPoolHourlySnapshot,
  LiquidityPoolDailySnapshot,
  LiquidityPool,
  LiquidityPoolFee,
  RewardToken,
  LptokenPool,
} from "../../generated/schema";
import { fetchTokenSymbol, fetchTokenName, fetchTokenDecimals } from "./tokens";
import {
  BIGDECIMAL_ZERO,
  Network,
  ProtocolType,
  SECONDS_PER_DAY,
  BIGINT_ZERO,
  ETH_ADDRESS,
  RewardTokenType,
  FACTORY,
  PROTOCOL_NAME,
  PROTOCOL_SLUG,
  EARLY_BASEPOOLS,
  PoolType,
  ZERO_ADDRESS,
} from "./constants";
import { createNewPool, getBasePool, getLpToken, getPoolCoinsFromAddress } from "../services/pool";
import { Versions } from "../versions";

export function getOrCreateToken(tokenAddress: Address): Token {
  let token = Token.load(tokenAddress.toHexString());
  // fetch info if null
  if (!token) {
    if (tokenAddress.toHexString().toLowerCase() == ETH_ADDRESS.toLowerCase()) {
      token = new Token(tokenAddress.toHexString());
      token.symbol = "ETH";
      token.name = "Ethereum";
      token.decimals = 18;
      token.save();
    } else {
      token = new Token(tokenAddress.toHexString());
      token.symbol = fetchTokenSymbol(tokenAddress);
      token.name = fetchTokenName(tokenAddress);
      token.decimals = fetchTokenDecimals(tokenAddress);
      token.save();
    }
  }
  return token;
}

export function getLiquidityPool(poolId: string): LiquidityPool {
  let pool = LiquidityPool.load(poolId);
  if (!pool) {
    return new LiquidityPool(poolId);
  }
  return pool;
}

export function getOrCreateUsageMetricHourlySnapshot(event: ethereum.Event): UsageMetricsHourlySnapshot {
  // Number of days since Unix epoch
  let id: i64 = event.block.timestamp.toI64() / SECONDS_PER_DAY;

  // Create unique id for the day
  let usageMetrics = UsageMetricsHourlySnapshot.load(id.toString());

  if (!usageMetrics) {
    usageMetrics = new UsageMetricsHourlySnapshot(id.toString());
    usageMetrics.protocol = FACTORY;

    usageMetrics.hourlyActiveUsers = 0;
    usageMetrics.cumulativeUniqueUsers = 0;
    usageMetrics.hourlyDepositCount = 0;
    usageMetrics.hourlyWithdrawCount = 0;
    usageMetrics.hourlySwapCount = 0;
    usageMetrics.hourlyTransactionCount = 0;
    usageMetrics.save();
  }

  return usageMetrics;
}

export function getOrCreateUsageMetricDailySnapshot(event: ethereum.Event): UsageMetricsDailySnapshot {
  // Number of days since Unix epoch
  let id: i64 = event.block.timestamp.toI64() / SECONDS_PER_DAY;

  // Create unique id for the day
  let usageMetrics = UsageMetricsDailySnapshot.load(id.toString());

  if (!usageMetrics) {
    usageMetrics = new UsageMetricsDailySnapshot(id.toString());
    usageMetrics.protocol = FACTORY;

    usageMetrics.dailyActiveUsers = 0;
    usageMetrics.cumulativeUniqueUsers = 0;
    usageMetrics.dailyDepositCount = 0;
    usageMetrics.dailyWithdrawCount = 0;
    usageMetrics.dailySwapCount = 0;
    usageMetrics.dailyTransactionCount = 0;
    usageMetrics.save();
  }

  return usageMetrics;
}

export function getOrCreatePoolHourlySnapshot(poolAddress: string, event: ethereum.Event): LiquidityPoolHourlySnapshot {
  let id: i64 = event.block.timestamp.toI64() / SECONDS_PER_DAY;
  let poolMetrics = LiquidityPoolHourlySnapshot.load(poolAddress.concat("-").concat(id.toString()));

  if (!poolMetrics) {
    poolMetrics = new LiquidityPoolHourlySnapshot(poolAddress.concat("-").concat(id.toString()));
    poolMetrics.protocol = FACTORY;
    poolMetrics.pool = poolAddress;
    poolMetrics.totalValueLockedUSD = BIGDECIMAL_ZERO;
    poolMetrics.hourlyVolumeUSD = BIGDECIMAL_ZERO;
    let hourlyVolumeByTokenAmount: BigInt[] = [];
    let hourlyVolumeByTokenUSD: BigDecimal[] = [];
    for (let i = 0; i <= getLiquidityPool(poolAddress).inputTokens.length; i++) {
      hourlyVolumeByTokenAmount.push(BIGINT_ZERO);
      hourlyVolumeByTokenUSD.push(BIGDECIMAL_ZERO);
    }
    poolMetrics.hourlyVolumeByTokenAmount = hourlyVolumeByTokenAmount;
    poolMetrics.hourlyVolumeByTokenUSD = hourlyVolumeByTokenUSD;
    poolMetrics.cumulativeVolumeUSD = BIGDECIMAL_ZERO;
    poolMetrics.inputTokenBalances = [];
    poolMetrics.inputTokenWeights = [];
    poolMetrics.outputTokenSupply = BIGINT_ZERO;
    poolMetrics.outputTokenPriceUSD = BIGDECIMAL_ZERO;
    poolMetrics.stakedOutputTokenAmount = BIGINT_ZERO;
    poolMetrics.rewardTokenEmissionsAmount = [];
    poolMetrics.rewardTokenEmissionsUSD = [];
    poolMetrics.save();
  }

  return poolMetrics;
}

export function getOrCreatePoolDailySnapshot(poolAddress: string, event: ethereum.Event): LiquidityPoolDailySnapshot {
  let id: i64 = event.block.timestamp.toI64() / SECONDS_PER_DAY;
  let poolMetrics = LiquidityPoolDailySnapshot.load(poolAddress.concat("-").concat(id.toString()));

  if (!poolMetrics) {
    let pool = getLiquidityPool(poolAddress);
    poolMetrics = new LiquidityPoolDailySnapshot(poolAddress.concat("-").concat(id.toString()));
    poolMetrics.protocol = FACTORY;
    poolMetrics.pool = poolAddress;
    poolMetrics.totalValueLockedUSD = pool.totalValueLockedUSD;
    poolMetrics.dailyVolumeUSD = BIGDECIMAL_ZERO;
    let dailyVolumeByTokenAmount: BigInt[] = [];
    let dailyVolumeByTokenUSD: BigDecimal[] = [];
    for (let i = 0; i <= pool.inputTokens.length; i++) {
      dailyVolumeByTokenAmount.push(BIGINT_ZERO);
      dailyVolumeByTokenUSD.push(BIGDECIMAL_ZERO);
    }
    poolMetrics.dailyVolumeByTokenAmount = dailyVolumeByTokenAmount;
    poolMetrics.dailyVolumeByTokenUSD = dailyVolumeByTokenUSD;
    poolMetrics.cumulativeVolumeUSD = pool.cumulativeVolumeUSD;
    poolMetrics.inputTokenBalances = pool.inputTokenBalances;
    poolMetrics.inputTokenWeights = pool.inputTokenWeights;
    poolMetrics.outputTokenSupply = pool.outputTokenSupply;
    poolMetrics.outputTokenPriceUSD = pool.outputTokenPriceUSD;
    poolMetrics.stakedOutputTokenAmount = pool.stakedOutputTokenAmount;
    poolMetrics.rewardTokenEmissionsAmount = pool.rewardTokenEmissionsAmount;
    poolMetrics.rewardTokenEmissionsUSD = pool.rewardTokenEmissionsUSD;
    poolMetrics.save();
  }

  return poolMetrics;
}

export function getOrCreateFinancialsDailySnapshot(event: ethereum.Event): FinancialsDailySnapshot {
  // Number of days since Unix epoch
  let id: i64 = event.block.timestamp.toI64() / SECONDS_PER_DAY;

  let financialMetrics = FinancialsDailySnapshot.load(id.toString());

  if (!financialMetrics) {
    let protocol = getOrCreateDexAmm();
    financialMetrics = new FinancialsDailySnapshot(id.toString());
    financialMetrics.protocol = FACTORY;
    financialMetrics.totalValueLockedUSD = protocol.totalValueLockedUSD;
    financialMetrics.protocolControlledValueUSD = protocol.protocolControlledValueUSD;
    financialMetrics.dailyVolumeUSD = BIGDECIMAL_ZERO;
    financialMetrics.cumulativeVolumeUSD = protocol.cumulativeVolumeUSD;
    financialMetrics.dailySupplySideRevenueUSD = BIGDECIMAL_ZERO;
    financialMetrics.cumulativeSupplySideRevenueUSD = protocol.cumulativeSupplySideRevenueUSD;
    financialMetrics.dailyProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    financialMetrics.cumulativeProtocolSideRevenueUSD = protocol.cumulativeProtocolSideRevenueUSD;
    financialMetrics.dailyTotalRevenueUSD = BIGDECIMAL_ZERO;
    financialMetrics.cumulativeTotalRevenueUSD = protocol.cumulativeTotalRevenueUSD;
    financialMetrics.timestamp = event.block.timestamp;
    financialMetrics.blockNumber = event.block.number;
    financialMetrics.save();
  }
  return financialMetrics;
}

///////////////////////////
///// DexAmm Specific /////
///////////////////////////

export function getOrCreateDexAmm(): DexAmmProtocol {
  let protocol = DexAmmProtocol.load(FACTORY);

  if (!protocol) {
    protocol = new DexAmmProtocol(FACTORY);
    protocol.name = PROTOCOL_NAME;
    protocol.slug = PROTOCOL_SLUG;
    protocol.network = Network.BSC;
    protocol.type = ProtocolType.EXCHANGE;
    protocol.totalValueLockedUSD = BIGDECIMAL_ZERO;
    protocol.protocolControlledValueUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeVolumeUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeUniqueUsers = 0;
  }

  protocol.schemaVersion = Versions.getSchemaVersion();
  protocol.subgraphVersion = Versions.getSubgraphVersion();
  protocol.methodologyVersion = Versions.getMethodologyVersion();

  protocol.save();

  return protocol;
}

export function getPoolFee(poolID: string, feeType: string): LiquidityPoolFee {
  let poolFee = LiquidityPoolFee.load(feeType + "-" + poolID);
  if (!poolFee) {
    poolFee = new LiquidityPoolFee(feeType + "-" + poolID);
    poolFee.feeType = feeType;
    poolFee.save();
  }
  return poolFee;
}

export function getOrCreateRewardToken(tokenAddr: Address): RewardToken {
  const rewardTokenId = RewardTokenType.DEPOSIT + "-" + tokenAddr.toHexString();
  let rewardToken = RewardToken.load(rewardTokenId);
  if (!rewardToken) {
    rewardToken = new RewardToken(rewardTokenId);
    rewardToken.type = RewardTokenType.DEPOSIT;
    rewardToken.token = getOrCreateToken(tokenAddr).id;
    rewardToken.save();
  }
  return rewardToken;
}

export function getRewardtoken(rewardTokenId: string): RewardToken {
  let rewardToken = RewardToken.load(rewardTokenId);
  if (!rewardToken) {
    return new RewardToken(rewardTokenId);
  }
  return rewardToken;
}

export function getOrCreatePool(poolAddress: Address, event: ethereum.Event): LiquidityPool {
  let pool = LiquidityPool.load(poolAddress.toHexString());
  if (!pool) {
    const lpToken = getLpToken(poolAddress);
    const lpTokenEntity = getOrCreateToken(lpToken);
    const basePool = getBasePool(poolAddress);
    const poolCoins = getPoolCoinsFromAddress(poolAddress);
    const pooltype = EARLY_BASEPOOLS.includes(poolAddress) ? PoolType.BASEPOOL : PoolType.PLAIN;
    pool = createNewPool(
      poolAddress,
      lpToken,
      lpTokenEntity.name,
      lpTokenEntity.symbol,
      event.block.number,
      event.block.timestamp,
      basePool,
      poolCoins,
      pooltype,
    );
  }
  return pool;
}

export function getPoolFromLpToken(lpToken: Address): string {
  let lptokenPool = LptokenPool.load(lpToken.toHexString());
  if (!lptokenPool) {
    return ZERO_ADDRESS;
  }
  return lptokenPool.pool;
}

export function createEventID(eventType: string, event: ethereum.Event): string {
  return eventType + "-" + event.transaction.hash.toHexString() + "-" + event.logIndex.toString();
}
