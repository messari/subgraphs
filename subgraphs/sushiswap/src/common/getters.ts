// import { log } from "@graphprotocol/graph-ts"
import { Address, BigDecimal, BigInt, ethereum } from "@graphprotocol/graph-ts";
import {
  _Account,
  _DailyActiveAccount,
  _Transfer,
  Token,
  DexAmmProtocol,
  UsageMetricsDailySnapshot,
  FinancialsDailySnapshot,
  PoolDailySnapshot,
  LiquidityPool,
  LiquidityPoolFee,
} from "../../generated/schema";
import { fetchTokenSymbol, fetchTokenName, fetchTokenDecimals } from "./tokens";
import {
  BIGDECIMAL_ZERO,
  Network,
  ProtocolType,
  SUSHISWAP_V2_FACTORY_ADDRESS,
  SECONDS_PER_DAY,
} from "../common/constants";

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

export function getOrCreateUsageMetricsDailySnapshot(event: ethereum.Event): UsageMetricsDailySnapshot {
  // Number of days since Unix epoch
  let id: i64 = event.block.timestamp.toI64() / SECONDS_PER_DAY;

  // Create unique id for the day
  let usageMetrics = UsageMetricsDailySnapshot.load(id.toString());

  if (!usageMetrics) {
    usageMetrics = new UsageMetricsDailySnapshot(id.toString());
    usageMetrics.protocol = SUSHISWAP_V2_FACTORY_ADDRESS;

    usageMetrics.activeUsers = 0;
    usageMetrics.totalUniqueUsers = 0;
    usageMetrics.dailyTransactionCount = 0;
    usageMetrics.save();
  }

  return usageMetrics;
}

export function getOrCreatePoolDailySnapshot(event: ethereum.Event): PoolDailySnapshot {
  let id: i64 = event.block.timestamp.toI64() / SECONDS_PER_DAY;
  let poolAddress = event.address.toHexString();
  let poolMetrics = PoolDailySnapshot.load(poolAddress.concat("-").concat(id.toString()));

  if (!poolMetrics) {
    poolMetrics = new PoolDailySnapshot(poolAddress.concat("-").concat(id.toString()));
    poolMetrics.protocol = SUSHISWAP_V2_FACTORY_ADDRESS;
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
    financialMetrics.protocol = SUSHISWAP_V2_FACTORY_ADDRESS;

    financialMetrics.feesUSD = BIGDECIMAL_ZERO;
    financialMetrics.totalVolumeUSD = BIGDECIMAL_ZERO;
    financialMetrics.totalValueLockedUSD = BIGDECIMAL_ZERO;
    financialMetrics.supplySideRevenueUSD = BIGDECIMAL_ZERO;
    financialMetrics.protocolSideRevenueUSD = BIGDECIMAL_ZERO;

    financialMetrics.save();
  }
  return financialMetrics;
}

export function getLiquidityPool(poolAddress: string): LiquidityPool {
  return LiquidityPool.load(poolAddress)!;
}

///////////////////////////
///// DexAmm Specific /////
///////////////////////////

export function getOrCreateDexAmm(): DexAmmProtocol {
  let protocol = DexAmmProtocol.load(SUSHISWAP_V2_FACTORY_ADDRESS);

  if (!protocol) {
    protocol = new DexAmmProtocol(SUSHISWAP_V2_FACTORY_ADDRESS);
    protocol.name = "SushiSwap v2";
    protocol.slug = "sushiswap-v2";
    protocol.schemaVersion = "1.0.2";
    protocol.subgraphVersion = "1.0.0";
    protocol.network = Network.ETHEREUM;
    protocol.type = ProtocolType.EXCHANGE;
    protocol.totalUniqueUsers = 0;
    protocol.totalValueLockedUSD = BIGDECIMAL_ZERO;
    protocol.save();

    // TODO: clean up
    let tradingFee = new LiquidityPoolFee("sushiswap-v2-trading-fee");
    tradingFee.feePercentage = BigDecimal.fromString("0.0025");
    tradingFee.feeType = "FIXED_TRADING_FEE";
    tradingFee.save();

    let protocolFee = new LiquidityPoolFee("sushiswap-v2-protocol-fee");
    protocolFee.feePercentage = BigDecimal.fromString("0.0005");
    protocolFee.feeType = "PROTOCOL_FEE";
    protocolFee.save();
  }
  return protocol;
}

export function getTransfer(txnHash: string): _Transfer {
  return _Transfer.load(txnHash)!;
}
