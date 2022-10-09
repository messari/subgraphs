// import { log } from '@graphprotocol/graph-ts'
import { Address, BigDecimal, ethereum, log } from "@graphprotocol/graph-ts";
import { BiswapERC20 } from "../../generated/BiswapFactory/BiswapERC20";
import {
  DexAmmProtocol,
  LiquidityPool,
  FinancialsDailySnapshot,
  UsageMetricsDailySnapshot,
  _LiquidityPoolAmount,
  LiquidityPoolFee,
  Token,
  LiquidityPoolHourlySnapshot,
  LiquidityPoolDailySnapshot,
  UsageMetricsHourlySnapshot,
} from "../../generated/schema";
import { getUsdPricePerToken } from "../prices";
import {
  INT_ZERO,
  BIGDECIMAL_ZERO,
  ProtocolType,
  SECONDS_PER_DAY,
  BIGINT_ZERO,
  SECONDS_PER_HOUR,
  Network,
  BISWAP_FACTORY_ADDR,
} from "./constants";

export function getOrCreateDex(): DexAmmProtocol {
  let protocol = DexAmmProtocol.load(BISWAP_FACTORY_ADDR);
  if (!protocol) {
    // Protocol Metadata
    protocol = new DexAmmProtocol(BISWAP_FACTORY_ADDR);
    protocol.name = "Biswap";
    protocol.slug = "biswap";
    protocol.schemaVersion = "1.3.0";
    protocol.subgraphVersion = "1.0.0";
    protocol.methodologyVersion = "1.0.0";
    protocol.network = Network.BSC;
    protocol.type = ProtocolType.EXCHANGE;

    // Quantitative Data
    protocol.totalValueLockedUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeVolumeUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeUniqueUsers = 0;
    protocol.totalPoolCount = 0;

    protocol.save();
  }
  return protocol;
}

export function getOrCreateLPToken(
  pairTokenAddress: string,
  token0: Token,
  token1: Token
): Token {
  let token = Token.load(pairTokenAddress);
  let tokenAddress = Address.fromString(pairTokenAddress);

  if (token === null) {
    token = new Token(pairTokenAddress);
    token.symbol = token0.name + " / " + token1.name;
    token.name = token0.name + " / " + token1.name + " LP";
    token.decimals = _fetchTokenDecimals(tokenAddress) as i32;
    token.save();
  }
  return token;
}

export function getOrCreateToken(
  event: ethereum.Event,
  address: string
): Token {
  let token = Token.load(address);
  let tokenAddress = Address.fromString(address);

  if (!token) {
    token = new Token(address);

    token.name = _fetchTokenName(tokenAddress);
    token.symbol = _fetchTokenSymbol(tokenAddress);
    token.decimals = _fetchTokenDecimals(tokenAddress) as i32;
  }

  const price = getUsdPricePerToken(tokenAddress);
  if (price.reverted) {
    token.lastPriceUSD = BIGDECIMAL_ZERO;
  } else {
    token.lastPriceUSD = price.usdPrice.div(price.decimalsBaseTen);
  }
  token.lastPriceBlockNumber = event.block.number;
  token.save();

  return token;
}

function _fetchTokenName(tokenAddress: Address): string {
  const tokenContract = BiswapERC20.bind(tokenAddress);
  const call = tokenContract.try_name();
  if (call.reverted) {
    return tokenAddress.toHexString();
  } else {
    return call.value;
  }
}

function _fetchTokenSymbol(tokenAddress: Address): string {
  const tokenContract = BiswapERC20.bind(tokenAddress);
  const call = tokenContract.try_symbol();
  if (call.reverted) {
    return " ";
  } else {
    return call.value;
  }
}

function _fetchTokenDecimals(tokenAddress: Address): number {
  const tokenContract = BiswapERC20.bind(tokenAddress);
  const call = tokenContract.try_decimals();
  if (call.reverted) {
    return 0;
  } else {
    return call.value;
  }
}

export function getLiquidityPool(poolAddress: string): LiquidityPool {
  return LiquidityPool.load(poolAddress)!;
}

export function getLiquidityPoolAmounts(
  poolAddress: string
): _LiquidityPoolAmount {
  return _LiquidityPoolAmount.load(poolAddress)!;
}

export function getLiquidityPoolFee(id: string): LiquidityPoolFee {
  return LiquidityPoolFee.load(id)!;
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
    usageMetrics.protocol = BISWAP_FACTORY_ADDR;

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
    usageMetrics.protocol = BISWAP_FACTORY_ADDR;

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
  event: ethereum.Event
): LiquidityPoolDailySnapshot {
  let day = event.block.timestamp.toI32() / SECONDS_PER_DAY;
  let dayId = day.toString();
  let poolMetrics = LiquidityPoolDailySnapshot.load(
    event.address.toHexString().concat("-").concat(dayId)
  );

  if (!poolMetrics) {
    poolMetrics = new LiquidityPoolDailySnapshot(
      event.address.toHexString().concat("-").concat(dayId)
    );
    poolMetrics.protocol = BISWAP_FACTORY_ADDR;
    poolMetrics.pool = event.address.toHexString();
    poolMetrics.totalValueLockedUSD = BIGDECIMAL_ZERO;
    poolMetrics.dailyVolumeUSD = BIGDECIMAL_ZERO;
    poolMetrics.dailyVolumeByTokenAmount = [BIGINT_ZERO, BIGINT_ZERO];
    poolMetrics.dailyVolumeByTokenUSD = [BIGDECIMAL_ZERO, BIGDECIMAL_ZERO];
    poolMetrics.cumulativeVolumeUSD = BIGDECIMAL_ZERO;
    poolMetrics.inputTokenBalances = [BIGINT_ZERO, BIGINT_ZERO];
    poolMetrics.inputTokenWeights = [BIGDECIMAL_ZERO, BIGDECIMAL_ZERO];

    poolMetrics.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
    poolMetrics.dailySupplySideRevenueUSD = BIGDECIMAL_ZERO;
    poolMetrics.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    poolMetrics.dailyProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    poolMetrics.dailyTotalRevenueUSD = BIGDECIMAL_ZERO;
    poolMetrics.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;

    poolMetrics.blockNumber = event.block.number;
    poolMetrics.timestamp = event.block.timestamp;

    poolMetrics.save();
  }

  return poolMetrics;
}

export function getOrCreateLiquidityPoolHourlySnapshot(
  event: ethereum.Event
): LiquidityPoolHourlySnapshot {
  let hour = event.block.timestamp.toI32() / SECONDS_PER_HOUR;

  let hourId = hour.toString();
  let poolMetrics = LiquidityPoolHourlySnapshot.load(
    event.address.toHexString().concat("-").concat(hourId)
  );

  if (!poolMetrics) {
    poolMetrics = new LiquidityPoolHourlySnapshot(
      event.address.toHexString().concat("-").concat(hourId)
    );
    poolMetrics.protocol = BISWAP_FACTORY_ADDR;
    poolMetrics.pool = event.address.toHexString();
    poolMetrics.totalValueLockedUSD = BIGDECIMAL_ZERO;
    poolMetrics.hourlyVolumeUSD = BIGDECIMAL_ZERO;
    poolMetrics.hourlyVolumeByTokenAmount = [BIGINT_ZERO, BIGINT_ZERO];
    poolMetrics.hourlyVolumeByTokenUSD = [BIGDECIMAL_ZERO, BIGDECIMAL_ZERO];
    poolMetrics.cumulativeVolumeUSD = BIGDECIMAL_ZERO;
    poolMetrics.inputTokenBalances = [BIGINT_ZERO, BIGINT_ZERO];
    poolMetrics.inputTokenWeights = [BIGDECIMAL_ZERO, BIGDECIMAL_ZERO];

    poolMetrics.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
    poolMetrics.hourlySupplySideRevenueUSD = BIGDECIMAL_ZERO;
    poolMetrics.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    poolMetrics.hourlyProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    poolMetrics.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;
    poolMetrics.hourlyTotalRevenueUSD = BIGDECIMAL_ZERO;

    poolMetrics.blockNumber = event.block.number;
    poolMetrics.timestamp = event.block.timestamp;

    poolMetrics.save();
  }

  return poolMetrics;
}

export function getOrCreateFinancialsDailySnapshot(
  event: ethereum.Event
): FinancialsDailySnapshot {
  // Number of days since Unix epoch
  let dayID = event.block.timestamp.toI32() / SECONDS_PER_DAY;
  let id = dayID.toString();

  let financialMetrics = FinancialsDailySnapshot.load(id);

  if (!financialMetrics) {
    financialMetrics = new FinancialsDailySnapshot(id);
    financialMetrics.protocol = BISWAP_FACTORY_ADDR;

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
