// import { log } from "@graphprotocol/graph-ts"
import { Address, ethereum, BigInt, BigDecimal } from "@graphprotocol/graph-ts";
import {
  Token,
  DexAmmProtocol,
  UsageMetricsHourlySnapshot,
  UsageMetricsDailySnapshot,
  FinancialsDailySnapshot,
  LiquidityPoolHourlySnapshot,
  LiquidityPoolDailySnapshot,
  LiquidityPool,
} from "../../generated/schema";
import { fetchTokenSymbol, fetchTokenName, fetchTokenDecimals } from "./tokens";
import {
  BIGDECIMAL_ZERO,
  Network,
  ProtocolType,
  SECONDS_PER_DAY,
  CURVE_REGISTRY_V2_MAINNET,
  BIGINT_ZERO,
  ETH_ADDRESS,
} from "../common/constants";
import { StableSwap } from "../../generated/templates/Pool/StableSwap";
import { CurvePoolCoin256 } from "../../generated/templates/Pool/CurvePoolCoin256";
import { CurvePoolCoin128 } from "../../generated/templates/Pool/CurvePoolCoin128";
import { getUsdPrice, getUsdPricePerToken } from "../prices";
import { exponentToBigInt } from "./utils/numbers";

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

export function getOrCreateUsageMetricHourlySnapshot(event: ethereum.Event): UsageMetricsHourlySnapshot {
  // Number of days since Unix epoch
  let id: i64 = event.block.timestamp.toI64() / SECONDS_PER_DAY;

  // Create unique id for the day
  let usageMetrics = UsageMetricsHourlySnapshot.load(id.toString());

  if (!usageMetrics) {
    usageMetrics = new UsageMetricsHourlySnapshot(id.toString());
    usageMetrics.protocol = CURVE_REGISTRY_V2_MAINNET;

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
    usageMetrics.protocol = CURVE_REGISTRY_V2_MAINNET;

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

export function getOrCreatePoolHourlySnapshot(event: ethereum.Event): LiquidityPoolHourlySnapshot {
  let id: i64 = event.block.timestamp.toI64() / SECONDS_PER_DAY;
  let poolAddress = event.address.toHexString();
  let poolMetrics = LiquidityPoolHourlySnapshot.load(poolAddress.concat("-").concat(id.toString()));

  if (!poolMetrics) {
    poolMetrics = new LiquidityPoolHourlySnapshot(poolAddress.concat("-").concat(id.toString()));
    poolMetrics.protocol = CURVE_REGISTRY_V2_MAINNET;
    poolMetrics.pool = poolAddress;
    poolMetrics.rewardTokenEmissionsAmount = [];
    poolMetrics.rewardTokenEmissionsUSD = [];

    poolMetrics.save();
  }

  return poolMetrics;
}

export function getOrCreatePoolDailySnapshot(event: ethereum.Event): LiquidityPoolDailySnapshot {
  let id: i64 = event.block.timestamp.toI64() / SECONDS_PER_DAY;
  let poolAddress = event.address.toHexString();
  let poolMetrics = LiquidityPoolDailySnapshot.load(poolAddress.concat("-").concat(id.toString()));

  if (!poolMetrics) {
    poolMetrics = new LiquidityPoolDailySnapshot(poolAddress.concat("-").concat(id.toString()));
    poolMetrics.protocol = CURVE_REGISTRY_V2_MAINNET;
    poolMetrics.pool = poolAddress;
    poolMetrics.rewardTokenEmissionsAmount = [];
    poolMetrics.rewardTokenEmissionsUSD = [];

    poolMetrics.save();
  }

  return poolMetrics;
}

export function getOrCreateFinancialsDailySnapshot(event: ethereum.Event): FinancialsDailySnapshot {
  // Number of days since Unix epoch
  let id: i64 = event.block.timestamp.toI64() / SECONDS_PER_DAY;

  let financialMetrics = FinancialsDailySnapshot.load(id.toString());

  if (!financialMetrics) {
    financialMetrics = new FinancialsDailySnapshot(id.toString());
    financialMetrics.protocol = CURVE_REGISTRY_V2_MAINNET;
    financialMetrics.totalValueLockedUSD = BIGDECIMAL_ZERO;
    financialMetrics.protocolControlledValueUSD = BIGDECIMAL_ZERO;
    financialMetrics.dailyVolumeUSD = BIGDECIMAL_ZERO;
    financialMetrics.cumulativeVolumeUSD = BIGDECIMAL_ZERO;
    financialMetrics.dailySupplySideRevenueUSD = BIGDECIMAL_ZERO;
    financialMetrics.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
    financialMetrics.dailyProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    financialMetrics.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    financialMetrics.dailyTotalRevenueUSD = BIGDECIMAL_ZERO;
    financialMetrics.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;
    financialMetrics.timestamp = BIGINT_ZERO;
    financialMetrics.blockNumber = BIGINT_ZERO;
    financialMetrics.save();
  }
  return financialMetrics;
}

///////////////////////////
///// DexAmm Specific /////
///////////////////////////

export function getOrCreateDexAmm(): DexAmmProtocol {
  let protocol = DexAmmProtocol.load(CURVE_REGISTRY_V2_MAINNET);

  if (!protocol) {
    protocol = new DexAmmProtocol(CURVE_REGISTRY_V2_MAINNET);
    protocol.name = "Curve";
    protocol.slug = "curve";
    protocol.schemaVersion = "1.2.0";
    protocol.subgraphVersion = "1.0.0";
    protocol.methodologyVersion = "1.0.0";
    protocol.network = Network.MAINNET;
    protocol.type = ProtocolType.EXCHANGE;
    protocol.totalValueLockedUSD = BIGDECIMAL_ZERO;
    protocol.protocolControlledValueUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeVolumeUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeUniqueUsers = 0;
    protocol.save();
  }
  return protocol;
}

export function getTokenPrice(tokenAddr: Address, event: ethereum.Event): BigDecimal {
  let token = getOrCreateToken(tokenAddr);
  let priceUSD = getUsdPricePerToken(tokenAddr).usdPrice;
  token.lastPriceUSD = priceUSD;
  token.lastPriceBlockNumber = event.block.number;
  token.save();
  return priceUSD
}