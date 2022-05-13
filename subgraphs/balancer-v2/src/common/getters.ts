import { Address, BigDecimal, BigInt, dataSource, ethereum } from "@graphprotocol/graph-ts";
import {
  Token,
  DexAmmProtocol,
  LiquidityPool,
  LiquidityPoolFee,
  FinancialsDailySnapshot,
  UsageMetricsDailySnapshot,
  Swap,
  LiquidityPoolDailySnapshot,
  LiquidityPoolHourlySnapshot,
  UsageMetricsHourlySnapshot,
} from "../../generated/schema";
import { fetchTokenSymbol, fetchTokenName, fetchTokenDecimals, scaleDown } from "./tokens";
import {
  BIGDECIMAL_ZERO,
  VAULT_ADDRESS,
  ProtocolType,
  SECONDS_PER_DAY,
  BIGINT_ZERO,
  LiquidityPoolFeeType,
  SECONDS_PER_HOUR,
  BIGDECIMAL_ONE,
} from "./constants";
import { WeightedPool as WeightedPoolTemplate } from "../../generated/templates";
import { WeightedPool } from "../../generated/Vault/WeightedPool";
import { ConvergentCurvePool } from "../../generated/Vault/ConvergentCurvePool";

export function getOrCreateDex(): DexAmmProtocol {
  let protocol = DexAmmProtocol.load(VAULT_ADDRESS.toHexString());
  if (protocol === null) {
    protocol = new DexAmmProtocol(VAULT_ADDRESS.toHexString());
    protocol.name = "Balancer V2";
    protocol.slug = "balancer-v2";
    protocol.subgraphVersion = "1.2.1";
    protocol.schemaVersion = "1.2.0";
    protocol.methodologyVersion = "1.0.0";
    protocol.totalValueLockedUSD = BIGDECIMAL_ZERO;
    protocol.protocolControlledValueUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeVolumeUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeUniqueUsers = 0;
    let network = hyphenToUnderscore(dataSource.network());
    protocol.network = network.toUpperCase();
    protocol.type = ProtocolType.EXCHANGE;
    protocol.save();
  }
  return protocol;
}

export function getOrCreateToken(tokenAddress: Address): Token {
  let token = Token.load(tokenAddress.toHexString());
  // fetch info if null
  if (token === null) {
    token = new Token(tokenAddress.toHexString().toLowerCase());
    token.symbol = fetchTokenSymbol(tokenAddress);
    token.name = fetchTokenName(tokenAddress);
    token.decimals = fetchTokenDecimals(tokenAddress);
    token.save();
  }
  return token;
}

export function createPool(id: string, address: Address, blockInfo: ethereum.Block): void {
  let pool = new LiquidityPool(id);
  let outputToken = getOrCreateToken(address);
  let protocol = getOrCreateDex();

  let wwPoolInstance = WeightedPool.bind(address);
  let swapFees: BigInt = BigInt.fromI32(0);
  let swapFeesCall = wwPoolInstance.try_getSwapFeePercentage();
  if (!swapFeesCall.reverted) {
    WeightedPoolTemplate.create(address);
    swapFees = swapFeesCall.value;
  } else {
    let convergentCurvePool = ConvergentCurvePool.bind(address);
    swapFeesCall = convergentCurvePool.try_percentFee();
    if (!swapFeesCall.reverted) {
      swapFees = swapFeesCall.value;
    }
  }

  let feeInDecimals = scaleDown(swapFees, null);

  let fee = new LiquidityPoolFee(id);
  fee.feePercentage = feeInDecimals;
  fee.feeType = LiquidityPoolFeeType.DYNAMIC_TRADING_FEE;
  fee.save();

  pool.name = outputToken.name;
  pool.protocol = protocol.id;
  pool.fees = [fee.id];
  pool.totalValueLockedUSD = BIGDECIMAL_ZERO;
  pool.cumulativeVolumeUSD = BIGDECIMAL_ZERO;
  pool.inputTokenBalances = [BIGINT_ZERO];
  pool.outputTokenSupply = BIGINT_ZERO;
  pool.outputTokenPriceUSD = BIGDECIMAL_ZERO;
  pool._totalSwapFee = BIGDECIMAL_ZERO;
  pool._protocolGeneratedFee = BIGDECIMAL_ZERO;
  pool._sideRevenueGeneratedFee = BIGDECIMAL_ZERO;
  pool.rewardTokenEmissionsAmount = [BIGINT_ZERO];
  pool.rewardTokenEmissionsUSD = [BIGDECIMAL_ZERO];
  pool.createdBlockNumber = blockInfo.number;
  pool.createdTimestamp = blockInfo.timestamp;
  pool.inputTokenWeights = [];
  pool.outputToken = outputToken.id;
  pool.save();

  protocol._poolIds = protocol._poolIds.concat([pool.id]);
  protocol.save();
}

export function getOrCreateFinancials(event: ethereum.Event): FinancialsDailySnapshot {
  // Number of days since Unix epoch
  let id: i64 = event.block.timestamp.toI64() / SECONDS_PER_DAY;

  let financialMetrics = FinancialsDailySnapshot.load(id.toString());

  if (!financialMetrics) {
    financialMetrics = new FinancialsDailySnapshot(id.toString());
    financialMetrics.protocol = getOrCreateDex().id;

    financialMetrics.totalValueLockedUSD = BIGDECIMAL_ZERO;
    financialMetrics.dailyVolumeUSD = BIGDECIMAL_ZERO;
    financialMetrics.cumulativeVolumeUSD = BIGDECIMAL_ZERO;
    financialMetrics.dailySupplySideRevenueUSD = BIGDECIMAL_ZERO;
    financialMetrics.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
    financialMetrics.dailyProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    financialMetrics.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    financialMetrics.dailyTotalRevenueUSD = BIGDECIMAL_ZERO;
    financialMetrics.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;

    financialMetrics.save();
  }
  return financialMetrics;
}

export function getOrCreateDailyUsageMetricSnapshot(event: ethereum.Event): UsageMetricsDailySnapshot {
  // Number of days since Unix epoch
  let id: i64 = event.block.timestamp.toI64() / SECONDS_PER_DAY;

  // Create unique id for the day
  let usageMetrics = UsageMetricsDailySnapshot.load(id.toString());

  if (!usageMetrics) {
    usageMetrics = new UsageMetricsDailySnapshot(id.toString());
    usageMetrics.protocol = getOrCreateDex().id;

    usageMetrics.dailyActiveUsers = 0;
    usageMetrics.cumulativeUniqueUsers = 0;
    usageMetrics.dailyTransactionCount = 0;
    usageMetrics.dailyDepositCount = 0;
    usageMetrics.dailyWithdrawCount = 0;
    usageMetrics.dailySwapCount = 0;
    usageMetrics.save();
  }

  return usageMetrics;
}

export function getOrCreateHourlyUsageMetricSnapshot(event: ethereum.Event): UsageMetricsHourlySnapshot {
  // Number of days since Unix epoch
  let id: i64 = event.block.timestamp.toI64() / SECONDS_PER_HOUR;

  // Create unique id for the day
  let usageMetrics = UsageMetricsHourlySnapshot.load(id.toString());

  if (!usageMetrics) {
    usageMetrics = new UsageMetricsHourlySnapshot(id.toString());
    usageMetrics.protocol = getOrCreateDex().id;

    usageMetrics.hourlyActiveUsers = 0;
    usageMetrics.cumulativeUniqueUsers = 0;
    usageMetrics.hourlyTransactionCount = 0;
    usageMetrics.hourlyDepositCount = 0;
    usageMetrics.hourlyWithdrawCount = 0;
    usageMetrics.hourlySwapCount = 0;
    usageMetrics.save();
  }

  return usageMetrics;
}

export function getOrCreateSwap(event: ethereum.Event, pool: LiquidityPool): Swap {
  const id = event.transaction.hash.toHexString().concat("-").concat(event.logIndex.toHexString());
  const protocol = getOrCreateDex();
  let swap = Swap.load(id);

  if (!swap) {
    swap = new Swap(id);
    swap.hash = event.transaction.hash.toHexString();
    swap.logIndex = event.logIndex.toI32();
    swap.from = event.transaction.from.toHexString();
    swap.to = event.transaction.from.toHexString();
    swap.blockNumber = event.block.number;
    swap.timestamp = event.block.timestamp;
    swap.protocol = protocol.id;
    swap.pool = pool.id;
  }

  return swap;
}

export function updatePoolDailySnapshot(event: ethereum.Event, pool: LiquidityPool): void {
  // Number of days since Unix epoch
  const daysSinceEpoch: i64 = event.block.timestamp.toI64() / SECONDS_PER_DAY;
  const id = pool.id.concat("-").concat(daysSinceEpoch.toString());
  let snapshot = LiquidityPoolDailySnapshot.load(id);
  if (!snapshot) {
    snapshot = new LiquidityPoolDailySnapshot(id);
    snapshot.protocol = pool.protocol;
    snapshot.pool = pool.id;
    snapshot.inputTokenBalances = pool.inputTokenBalances;
    snapshot.dailyVolumeUSD = BIGDECIMAL_ZERO;
    let dailyVolumeByTokenAmount = new Array<BigInt>();
    let dailyVolumeByTokenUSD = new Array<BigDecimal>();
    for (let i = 0; i < pool.inputTokens.length; i++) {
      dailyVolumeByTokenAmount.push(BIGINT_ZERO);
      dailyVolumeByTokenUSD.push(BIGDECIMAL_ZERO);
    }
    snapshot.dailyVolumeByTokenAmount = dailyVolumeByTokenAmount;
    snapshot.dailyVolumeByTokenUSD = dailyVolumeByTokenUSD;
  }

  let swapId = event.transaction.hash.toHexString().concat("-").concat(event.logIndex.toHexString());
  let swap = Swap.load(swapId);
  if (swap) {
    let newTokensAmount = snapshot.dailyVolumeByTokenAmount;
    let newTokensUSD = snapshot.dailyVolumeByTokenUSD;
    for (let i: i32 = 0; i < pool.inputTokens.length; i++) {
      if (Address.fromString(swap.tokenIn) == Address.fromString(pool.inputTokens[i])) {
        newTokensAmount[i] = newTokensAmount[i].plus(swap.amountIn);
        newTokensUSD[i] = newTokensUSD[i].plus(swap.amountInUSD);
      }

      if (Address.fromString(swap.tokenOut) == Address.fromString(pool.inputTokens[i])) {
        newTokensAmount[i] = newTokensAmount[i].minus(swap.amountOut);
        newTokensUSD[i] = newTokensUSD[i].minus(swap.amountOutUSD);
      }
    }
    let divisor =
      swap.amountInUSD.gt(BIGDECIMAL_ZERO) && swap.amountOutUSD.gt(BIGDECIMAL_ZERO)
        ? BigDecimal.fromString("2")
        : BIGDECIMAL_ONE;
    let swapValue = swap.amountInUSD.plus(swap.amountOutUSD).div(divisor);
    snapshot.dailyVolumeUSD = snapshot.dailyVolumeUSD.plus(swapValue);
    snapshot.dailyVolumeByTokenAmount = newTokensAmount;
    snapshot.dailyVolumeByTokenUSD = newTokensUSD;
  }
  snapshot.outputTokenSupply = pool.outputTokenSupply;
  snapshot.cumulativeVolumeUSD = pool.cumulativeVolumeUSD;
  snapshot.totalValueLockedUSD = pool.totalValueLockedUSD;
  snapshot.outputTokenPriceUSD = pool.outputTokenPriceUSD;
  snapshot.inputTokenBalances = pool.inputTokenBalances;
  snapshot.inputTokenWeights = pool.inputTokenWeights;
  snapshot.blockNumber = event.block.number;
  snapshot.timestamp = event.block.timestamp;
  snapshot.save();
}

export function updatePoolHourlySnapshot(event: ethereum.Event, pool: LiquidityPool): void {
  // Number of days since Unix epoch
  const hoursSinceEpoch: i64 = event.block.timestamp.toI64() / SECONDS_PER_HOUR;
  const id = pool.id.concat("-").concat(hoursSinceEpoch.toString());
  let snapshot = LiquidityPoolHourlySnapshot.load(id);
  if (!snapshot) {
    snapshot = new LiquidityPoolHourlySnapshot(id);
    snapshot.protocol = pool.protocol;
    snapshot.pool = pool.id;
    snapshot.inputTokenBalances = pool.inputTokenBalances;
    snapshot.hourlyVolumeUSD = BIGDECIMAL_ZERO;
    let hourlyVolumeByTokenAmount = new Array<BigInt>();
    let hourlyVolumeByTokenUSD = new Array<BigDecimal>();
    for (let i = 0; i < pool.inputTokens.length; i++) {
      hourlyVolumeByTokenAmount.push(BIGINT_ZERO);
      hourlyVolumeByTokenUSD.push(BIGDECIMAL_ZERO);
    }
    snapshot.hourlyVolumeByTokenAmount = hourlyVolumeByTokenAmount;
    snapshot.hourlyVolumeByTokenUSD = hourlyVolumeByTokenUSD;
  }

  let swapId = event.transaction.hash.toHexString().concat("-").concat(event.logIndex.toHexString());
  let swap = Swap.load(swapId);
  if (swap) {
    let newTokensAmount = snapshot.hourlyVolumeByTokenAmount;
    let newTokensUSD = snapshot.hourlyVolumeByTokenUSD;
    for (let i: i32 = 0; i < pool.inputTokens.length; i++) {
      if (Address.fromString(swap.tokenIn) == Address.fromString(pool.inputTokens[i])) {
        newTokensAmount[i] = newTokensAmount[i].plus(swap.amountIn);
        newTokensUSD[i] = newTokensUSD[i].plus(swap.amountInUSD);
      }

      if (Address.fromString(swap.tokenOut) == Address.fromString(pool.inputTokens[i])) {
        newTokensAmount[i] = newTokensAmount[i].minus(swap.amountOut);
        newTokensUSD[i] = newTokensUSD[i].minus(swap.amountOutUSD);
      }
    }
    let divisor =
      swap.amountInUSD.gt(BIGDECIMAL_ZERO) && swap.amountOutUSD.gt(BIGDECIMAL_ZERO)
        ? BigDecimal.fromString("2")
        : BIGDECIMAL_ONE;
    let swapValue = swap.amountInUSD.plus(swap.amountOutUSD).div(divisor);
    snapshot.hourlyVolumeUSD = snapshot.hourlyVolumeUSD.plus(swapValue);
    snapshot.hourlyVolumeByTokenAmount = newTokensAmount;
    snapshot.hourlyVolumeByTokenUSD = newTokensUSD;
  }
  snapshot.outputTokenSupply = pool.outputTokenSupply;
  snapshot.cumulativeVolumeUSD = pool.cumulativeVolumeUSD;
  snapshot.totalValueLockedUSD = pool.totalValueLockedUSD;
  snapshot.outputTokenPriceUSD = pool.outputTokenPriceUSD;
  snapshot.inputTokenBalances = pool.inputTokenBalances;
  snapshot.inputTokenWeights = pool.inputTokenWeights;
  snapshot.blockNumber = event.block.number;
  snapshot.timestamp = event.block.timestamp;
  snapshot.save();
}

// Converts hyphen to underscore in a string
// (e.g. "arbitrum-one" to "arbitrum_one"), mainly used in network
function hyphenToUnderscore(word: string): string {
  return word.replace("-", "_");
}
