// import { log } from '@graphprotocol/graph-ts'
import { Address, BigDecimal, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { ERC20 } from "../../generated/Vault/ERC20";
import {
  DexAmmProtocol,
  LiquidityPool,
  FinancialsDailySnapshot,
  UsageMetricsDailySnapshot,
  LiquidityPoolFee,
  Token,
  LiquidityPoolHourlySnapshot,
  LiquidityPoolDailySnapshot,
  UsageMetricsHourlySnapshot,
  RewardToken,
} from "../../generated/schema";
import {
  INT_ZERO,
  BIGDECIMAL_ZERO,
  ProtocolType,
  DEFAULT_DECIMALS,
  SECONDS_PER_DAY,
  BIGINT_ZERO,
  SECONDS_PER_HOUR,
  PROTOCOL_SCHEMA_VERSION,
  PROTOCOL_SUBGRAPH_VERSION,
  PROTOCOL_METHODOLOGY_VERSION,
  VAULT_ADDRESS,
  PROTOCOL_NAME,
  PROTOCOL_SLUG,
  DEFAULT_NETWORK,
  RewardTokenType,
} from "./constants";
import { fetchPrice } from "./pricing";

export function getOrCreateDex(): DexAmmProtocol {
  let protocol = DexAmmProtocol.load(VAULT_ADDRESS.toHexString());

  if (!protocol) {
    protocol = new DexAmmProtocol(VAULT_ADDRESS.toHexString());
    protocol.name = PROTOCOL_NAME;
    protocol.slug = PROTOCOL_SLUG;
    protocol.schemaVersion = PROTOCOL_SCHEMA_VERSION;
    protocol.subgraphVersion = PROTOCOL_SUBGRAPH_VERSION;
    protocol.methodologyVersion = PROTOCOL_METHODOLOGY_VERSION;
    protocol.totalValueLockedUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeVolumeUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeUniqueUsers = INT_ZERO;
    protocol.network = DEFAULT_NETWORK;
    protocol.type = ProtocolType.EXCHANGE;
    protocol.totalPoolCount = 0;
    protocol.totalAllocPoint = BIGINT_ZERO;
    protocol.beetsPerBlock = BIGINT_ZERO;
    protocol.save();
  }
  return protocol;
}

export function getOrCreateToken(address: string): Token {
  let token = Token.load(address);
  if (!token) {
    token = new Token(address);
    let erc20Contract = ERC20.bind(Address.fromString(address));
    let decimals = erc20Contract.try_decimals();
    // Using try_cause some values might be missing
    let name = erc20Contract.try_name();
    let symbol = erc20Contract.try_symbol();
    // TODO: add overrides for name and symbol
    token.decimals = decimals.reverted ? DEFAULT_DECIMALS : decimals.value;
    token.name = name.reverted ? "" : name.value;
    token.symbol = symbol.reverted ? "" : symbol.value;
    token.lastPriceUSD = BIGDECIMAL_ZERO;
    token.lastPriceBlockNumber = BIGINT_ZERO;
    token.save();
  }
  return token as Token;
}

export function getLiquidityPool(poolAddress: string): LiquidityPool {
  return LiquidityPool.load(poolAddress)!;
}

export function getLiquidityPoolFee(id: string): LiquidityPoolFee {
  return LiquidityPoolFee.load(id)!;
}
export function getOrCreateUsageMetricDailySnapshot(event: ethereum.Event): UsageMetricsDailySnapshot {
  // Number of days since Unix epoch
  let id = event.block.timestamp.toI32() / SECONDS_PER_DAY;
  let dayId = id.toString();
  // Create unique id for the day
  let usageMetrics = UsageMetricsDailySnapshot.load(dayId);

  if (!usageMetrics) {
    usageMetrics = new UsageMetricsDailySnapshot(dayId);
    usageMetrics.protocol = VAULT_ADDRESS.toHexString();

    usageMetrics.dailyActiveUsers = INT_ZERO;
    usageMetrics.cumulativeUniqueUsers = INT_ZERO;
    usageMetrics.dailyTransactionCount = INT_ZERO;
    usageMetrics.dailyDepositCount = INT_ZERO;
    usageMetrics.dailyWithdrawCount = INT_ZERO;
    usageMetrics.dailySwapCount = INT_ZERO;

    usageMetrics.blockNumber = event.block.number;
    usageMetrics.timestamp = event.block.timestamp;
    usageMetrics.totalPoolCount = 0;
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
    usageMetrics.protocol = VAULT_ADDRESS.toHexString();

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
  event: ethereum.Event,
  poolAddress: string,
): LiquidityPoolDailySnapshot {
  let day = event.block.timestamp.toI32() / SECONDS_PER_DAY;
  let dayId = day.toString();
  let pool = LiquidityPool.load(poolAddress);
  let poolMetrics = LiquidityPoolDailySnapshot.load(poolAddress.concat("-").concat(dayId));

  if (!poolMetrics) {
    poolMetrics = new LiquidityPoolDailySnapshot(poolAddress.concat("-").concat(dayId));
    poolMetrics.protocol = VAULT_ADDRESS.toHexString();
    poolMetrics.pool = poolAddress;
    poolMetrics.totalValueLockedUSD = BIGDECIMAL_ZERO;
    poolMetrics.dailyVolumeUSD = BIGDECIMAL_ZERO;
    poolMetrics.cumulativeVolumeUSD = BIGDECIMAL_ZERO;
    let dailyVolumeByTokenAmount: BigInt[] = [];
    let dailyVolumeByTokenUSD: BigDecimal[] = [];
    let inputTokenBalances: BigInt[] = [];
    let inputTokenWeights: BigDecimal[] = [];
    for (let index = 0; index < pool!.inputTokens.length; index++) {
      dailyVolumeByTokenAmount.push(BIGINT_ZERO);
      dailyVolumeByTokenUSD.push(BIGDECIMAL_ZERO);
      inputTokenBalances.push(BIGINT_ZERO);
      inputTokenWeights.push(BIGDECIMAL_ZERO);
    }
    poolMetrics.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    poolMetrics.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
    poolMetrics.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;

    poolMetrics.dailyProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    poolMetrics.dailySupplySideRevenueUSD = BIGDECIMAL_ZERO;
    poolMetrics.dailyTotalRevenueUSD = BIGDECIMAL_ZERO;

    poolMetrics.dailyVolumeByTokenAmount = dailyVolumeByTokenAmount;
    poolMetrics.dailyVolumeByTokenUSD = dailyVolumeByTokenUSD;
    poolMetrics.inputTokenBalances = inputTokenBalances;
    poolMetrics.inputTokenWeights = inputTokenWeights;

    poolMetrics.blockNumber = event.block.number;
    poolMetrics.timestamp = event.block.timestamp;

    poolMetrics.save();
  }

  return poolMetrics;
}

export function getOrCreateLiquidityPoolHourlySnapshot(
  event: ethereum.Event,
  poolAddress: string,
): LiquidityPoolHourlySnapshot {
  let hour = event.block.timestamp.toI32() / SECONDS_PER_HOUR;
  let pool = LiquidityPool.load(poolAddress);
  let hourId = hour.toString();
  let poolMetrics = LiquidityPoolHourlySnapshot.load(poolAddress.concat("-").concat(hourId));

  if (!poolMetrics) {
    poolMetrics = new LiquidityPoolHourlySnapshot(poolAddress.concat("-").concat(hourId));
    poolMetrics.protocol = VAULT_ADDRESS.toHexString();
    poolMetrics.pool = poolAddress;
    poolMetrics.totalValueLockedUSD = BIGDECIMAL_ZERO;
    poolMetrics.hourlyVolumeUSD = BIGDECIMAL_ZERO;
    poolMetrics.cumulativeVolumeUSD = BIGDECIMAL_ZERO;
    let hourlyVolumeByTokenAmount: BigInt[] = [];
    let hourlyVolumeByTokenUSD: BigDecimal[] = [];
    let inputTokenBalances: BigInt[] = [];
    let inputTokenWeights: BigDecimal[] = [];
    for (let index = 0; index < pool!.inputTokens.length; index++) {
      hourlyVolumeByTokenAmount.push(BIGINT_ZERO);
      hourlyVolumeByTokenUSD.push(BIGDECIMAL_ZERO);
      inputTokenBalances.push(BIGINT_ZERO);
      inputTokenWeights.push(BIGDECIMAL_ZERO);
    }

    poolMetrics.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    poolMetrics.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
    poolMetrics.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;

    poolMetrics.hourlyProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    poolMetrics.hourlySupplySideRevenueUSD = BIGDECIMAL_ZERO;
    poolMetrics.hourlyTotalRevenueUSD = BIGDECIMAL_ZERO;

    poolMetrics.hourlyVolumeByTokenAmount = hourlyVolumeByTokenAmount;
    poolMetrics.hourlyVolumeByTokenUSD = hourlyVolumeByTokenUSD;
    poolMetrics.inputTokenBalances = inputTokenBalances;
    poolMetrics.inputTokenWeights = inputTokenWeights;

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
    financialMetrics.protocol = VAULT_ADDRESS.toHexString();

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

export function getOrCreateRewardToken(address: string): RewardToken {
  let rewardToken = RewardToken.load(address);
  if (rewardToken == null) {
    let token = getOrCreateToken(address);
    rewardToken = new RewardToken(address);
    rewardToken.token = token.id;
    rewardToken.type = RewardTokenType.DEPOSIT;
    rewardToken.save();

    return rewardToken as RewardToken;
  }
  return rewardToken as RewardToken;
}
