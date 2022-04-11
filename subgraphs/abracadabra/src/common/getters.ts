// import { log } from "@graphprotocol/graph-ts"
import { Address, ethereum } from "@graphprotocol/graph-ts";
import { Token, UsageMetricsDailySnapshot, FinancialsDailySnapshot, MarketDailySnapshot, LendingProtocol, Market, _TokenPricesUsd, _LiquidationCache } from "../../generated/schema";
import { LogRepay } from "../../generated/templates/cauldron/cauldron"
import { fetchTokenSymbol, fetchTokenName, fetchTokenDecimals } from "./tokens";
import {
  BIGDECIMAL_ZERO,
  Network,
  INT_ZERO,
  ProtocolType,
  SECONDS_PER_DAY,
  BENTOBOX_ADDRESS,
  LendingType,
  BIGINT_ONE
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

///////////////////////////
///// Metrics /////
///////////////////////////

export function getOrCreateUsageMetricSnapshot(event: ethereum.Event): UsageMetricsDailySnapshot {
  // Number of days since Unix epoch
  let id: i64 = event.block.timestamp.toI64() / SECONDS_PER_DAY;

  // Create unique id for the day
  let usageMetrics = UsageMetricsDailySnapshot.load(id.toString());

  if (!usageMetrics) {
    usageMetrics = new UsageMetricsDailySnapshot(id.toString());
    usageMetrics.protocol = BENTOBOX_ADDRESS;

    usageMetrics.activeUsers = 0;
    usageMetrics.totalUniqueUsers = 0;
    usageMetrics.dailyTransactionCount = 0;
    usageMetrics.save();
  }

  return usageMetrics;
}

export function getOrCreateMarketDailySnapshot(event: ethereum.Event): MarketDailySnapshot {
  let id: i64 = event.block.timestamp.toI64() / SECONDS_PER_DAY;
  let marketAddress = event.address.toHexString();
  let marketMetrics = MarketDailySnapshot.load(marketAddress.concat("-").concat(id.toString()));

  if (!marketMetrics) {
    marketMetrics = new MarketDailySnapshot(marketAddress.concat("-").concat(id.toString()));
    marketMetrics.protocol = BENTOBOX_ADDRESS;
    marketMetrics.market = marketAddress;
    marketMetrics.rewardTokenEmissionsAmount = [];
    marketMetrics.rewardTokenEmissionsUSD = [];

    marketMetrics.save();
  }

  return marketMetrics;
}

export function getOrCreateFinancials(event: ethereum.Event): FinancialsDailySnapshot {
  // Number of days since Unix epoch
  let id: i64 = event.block.timestamp.toI64() / SECONDS_PER_DAY;

  let financialMetrics = FinancialsDailySnapshot.load(id.toString());

  if (!financialMetrics) {
    financialMetrics = new FinancialsDailySnapshot(id.toString());
    financialMetrics.protocol = BENTOBOX_ADDRESS;

    financialMetrics.feesUSD = BIGDECIMAL_ZERO;
    financialMetrics.totalVolumeUSD = BIGDECIMAL_ZERO;
    financialMetrics.totalValueLockedUSD = BIGDECIMAL_ZERO;
    financialMetrics.supplySideRevenueUSD = BIGDECIMAL_ZERO;
    financialMetrics.protocolSideRevenueUSD = BIGDECIMAL_ZERO;
    financialMetrics.feesUSD = BIGDECIMAL_ZERO;
    financialMetrics.protocolTreasuryUSD = BIGDECIMAL_ZERO;
    financialMetrics.save();
  }
  return financialMetrics;
}

///////////////////////////
///// Lending Specific /////
///////////////////////////

export function getOrCreateLendingProtocol(): LendingProtocol {
  let LendingProtocolEntity = LendingProtocol.load(BENTOBOX_ADDRESS)
  if (LendingProtocolEntity){
    return LendingProtocolEntity
  }
  LendingProtocolEntity = new LendingProtocol(BENTOBOX_ADDRESS)
  LendingProtocolEntity.name = "Abracadabra Money"
  LendingProtocolEntity.slug = "abra"
  LendingProtocolEntity.schemaVersion = "1.0.1"
  LendingProtocolEntity.subgraphVersion = "0.0.5"
  LendingProtocolEntity.network = Network.ETHEREUM
  LendingProtocolEntity.type = ProtocolType.LENDING
  LendingProtocolEntity.totalUniqueUsers = INT_ZERO
  LendingProtocolEntity.totalValueLockedUSD = BIGDECIMAL_ZERO
  LendingProtocolEntity.lendingType = LendingType.CDP
  LendingProtocolEntity.save()
  return LendingProtocolEntity
}

export function getMarket(marketId: string): Market {
  let market = Market.load(marketId);
  if (market) {
      return market;
  }
  return new Market("")
}

///////////////////////////
///// Helpers /////
///////////////////////////

export function getCachedLiquidation(event: LogRepay): _LiquidationCache{
  let cachedLiquidation = _LiquidationCache.load(event.transaction.hash.toHexString() + "_" + event.transactionLogIndex.minus(BIGINT_ONE).toString() + "_Liquidation")
  if (cachedLiquidation) {
    return cachedLiquidation;
  }
  return new _LiquidationCache("")
}