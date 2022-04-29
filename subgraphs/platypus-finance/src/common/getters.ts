import { log } from "@graphprotocol/graph-ts";
import { Address, BigDecimal, BigInt, ethereum } from "@graphprotocol/graph-ts";
import {
  Token,
  DexAmmProtocol,
  LiquidityPool,
  UsageMetricsDailySnapshot,
  UsageMetricsHourlySnapshot,
  FinancialsDailySnapshot,
  LiquidityPoolDailySnapshot,
  LiquidityPoolHourlySnapshot,
  _LiquidityPoolParamsHelper,
} from "../../generated/schema";
import { fetchTokenSymbol, fetchTokenName, fetchTokenDecimals } from "./tokens";
import { Network, PROTOCOL_ADMIN, ProtocolType, SECONDS_PER_DAY, SECONDS_PER_HOUR } from "../common/constants";
import { exponentToBigDecimal } from "./utils/numbers";

export function getOrCreateToken(tokenAddress: Address): Token {
  let token = Token.load(tokenAddress.toHexString());
  // fetch info if null
  if (!token) {
    token = new Token(tokenAddress.toHexString());
    token.symbol = fetchTokenSymbol(tokenAddress);
    token.name = fetchTokenName(tokenAddress);
    token.decimals = fetchTokenDecimals(tokenAddress);
    token.save();
  }
  return token;
}

export function getOrCreateLiquidityPool(poolAddress: Address): LiquidityPool {
  let pool = LiquidityPool.load(poolAddress.toHexString());
  // fetch info if null
  if (!pool) {
    pool = new LiquidityPool(poolAddress.toHexString());
    pool.protocol = getOrCreateDexAmm().id;

    let poolParam = new _LiquidityPoolParamsHelper(poolAddress.toHexString());

    poolParam.Dev = PROTOCOL_ADMIN;
    poolParam.SlippageParamsK = BigDecimal.fromString("0.00002e18");
    poolParam.SlippageParamsN = BigDecimal.fromString("7");
    poolParam.SlippageParamsC1 = BigDecimal.fromString("376927610599998308");
    poolParam.SlippageParamsXThreshold = BigDecimal.fromString("329811659274998519");
    poolParam.HaircutRate = BigDecimal.fromString("0.0003e18");
    poolParam.RetentionRatio = exponentToBigDecimal(18);
    poolParam.PriceDeviation = BigDecimal.fromString("0.02e18");

    poolParam.save();
    pool.save();

    let protocol = getOrCreateDexAmm();
    let _pools: string[] = protocol.pools;
    _pools.push(pool.id);
    protocol.pools = _pools;
    protocol.save();
  }
  return pool;
}

export function getOrCreateDailyUsageMetricSnapshot(event: ethereum.Event): UsageMetricsDailySnapshot {
  // Number of days since Unix epoch
  let id: i64 = event.block.timestamp.toI64() / SECONDS_PER_DAY;

  // Create unique id for the day
  let usageMetrics = UsageMetricsDailySnapshot.load(id.toString());

  if (!usageMetrics) {
    usageMetrics = new UsageMetricsDailySnapshot(id.toString());
    usageMetrics.protocol = PROTOCOL_ADMIN;

    usageMetrics.save();
  }

  return usageMetrics;
}

export function getOrCreateHourlyUsageMetricSnapshot(event: ethereum.Event): UsageMetricsHourlySnapshot {
  // " { # of hours since Unix epoch time } "
  let id: i64 = event.block.timestamp.toI64() / SECONDS_PER_HOUR;

  // Create unique id for the day
  let usageMetrics = UsageMetricsHourlySnapshot.load(id.toString());

  if (!usageMetrics) {
    usageMetrics = new UsageMetricsHourlySnapshot(id.toString());
    usageMetrics.protocol = getOrCreateDexAmm().id;

    usageMetrics.save();
  }

  return usageMetrics;
}

export function getOrCreateLiquidityPoolDailySnapshot(event: ethereum.Event): LiquidityPoolDailySnapshot {
  let id: i64 = event.block.timestamp.toI64() / SECONDS_PER_DAY;
  let poolAddress = event.address.toHexString();
  let poolDailyMetrics = LiquidityPoolDailySnapshot.load(poolAddress.concat("-").concat(id.toString()));

  if (!poolDailyMetrics) {
    poolDailyMetrics = new LiquidityPoolDailySnapshot(poolAddress.concat("-").concat(id.toString()));
    poolDailyMetrics.protocol = PROTOCOL_ADMIN;
    poolDailyMetrics.pool = poolAddress;
    poolDailyMetrics.rewardTokenEmissionsAmount = [];
    poolDailyMetrics.rewardTokenEmissionsUSD = [];

    poolDailyMetrics.blockNumber = event.block.number;
    poolDailyMetrics.timestamp = event.block.timestamp;

    poolDailyMetrics.save();
  }

  return poolDailyMetrics;
}

export function getOrCreateLiquidityPoolHourlySnapshot(event: ethereum.Event): LiquidityPoolHourlySnapshot {
  let id: i64 = event.block.timestamp.toI64() / SECONDS_PER_HOUR;

  let poolAddress = event.address.toHexString();

  let poolHourlyMetrics = LiquidityPoolHourlySnapshot.load(poolAddress.concat("-").concat(id.toString()));

  if (!poolHourlyMetrics) {
    poolHourlyMetrics = new LiquidityPoolHourlySnapshot(poolAddress.concat("-").concat(id.toString()));
    poolHourlyMetrics.protocol = PROTOCOL_ADMIN;
    poolHourlyMetrics.pool = poolAddress;
    poolHourlyMetrics.rewardTokenEmissionsAmount = [];
    poolHourlyMetrics.rewardTokenEmissionsUSD = [];

    poolHourlyMetrics.blockNumber = event.block.number;
    poolHourlyMetrics.timestamp = event.block.timestamp;

    poolHourlyMetrics.save();
  }

  return poolHourlyMetrics;
}

export function getOrCreateFinancialsDailySnapshot(event: ethereum.Event): FinancialsDailySnapshot {
  // Number of days since Unix epoch
  let id: i64 = event.block.timestamp.toI64() / SECONDS_PER_DAY;

  let financialMetrics = FinancialsDailySnapshot.load(id.toString());

  if (!financialMetrics) {
    financialMetrics = new FinancialsDailySnapshot(id.toString());
    financialMetrics.protocol = getOrCreateDexAmm().id;

    financialMetrics.blockNumber = event.block.number;
    financialMetrics.timestamp = event.block.timestamp;

    financialMetrics.save();
  }
  return financialMetrics;
}

///////////////////////////
///// DexAmm Specific /////
///////////////////////////

export function getOrCreateDexAmm(): DexAmmProtocol {
  let protocol = DexAmmProtocol.load(PROTOCOL_ADMIN);

  if (!protocol) {
    protocol = new DexAmmProtocol(PROTOCOL_ADMIN);
    protocol.name = "Platypus Finance";
    protocol.slug = "platypus-finance";
    protocol.schemaVersion = "1.2.0";
    protocol.subgraphVersion = "1.0.0";
    protocol.network = Network.AVALANCHE;
    protocol.type = ProtocolType.EXCHANGE;

    protocol.save();
  }
  return protocol;
}

export function getOrFetchTokenUsdPrice(event: ethereum.Event, tokenAddress: Address): BigDecimal {
  let token = getOrCreateToken(tokenAddress);

  if (!token.lastPriceUSD || !token.lastPriceBlockNumber || token.lastPriceBlockNumber < event.block.number) {
    log.debug("UPDATE THE PRICE!", []);
    token.lastPriceUSD = BigDecimal.fromString("1");
    token.lastPriceBlockNumber = event.block.number;
    token.save();
  }
  return token.lastPriceUSD!;
}
