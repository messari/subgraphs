// import { log } from "@graphprotocol/graph-ts"
import { Address, Bytes, ethereum, log, BigInt } from "@graphprotocol/graph-ts";
import {
  Token,
  UsageMetricsDailySnapshot,
  FinancialsDailySnapshot,
  MarketDailySnapshot,
  LendingProtocol,
  Market,
  _Ilk,
  _Proxy,
} from "../../generated/schema";
import { fetchTokenSymbol, fetchTokenName, fetchTokenDecimals } from "./tokens";
import {
  BIGDECIMAL_ZERO,
  Network,
  ProtocolType,
  SECONDS_PER_DAY,
  LendingType,
  VAT_ADDRESS,
  ZERO_ADDRESS,
} from "../common/constants";
import { DsProxy } from "../../generated/templates/DsProxy/DsProxy";

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
///////// Metrics /////////
///////////////////////////

export function getOrCreateUsageMetricSnapshot(event: ethereum.Event): UsageMetricsDailySnapshot {
  // Number of days since Unix epoch
  let id: i64 = event.block.timestamp.toI64() / SECONDS_PER_DAY;

  // Create unique id for the day
  let usageMetrics = UsageMetricsDailySnapshot.load(id.toString());

  if (!usageMetrics) {
    usageMetrics = new UsageMetricsDailySnapshot(id.toString());
    usageMetrics.protocol = getOrCreateLendingProtocol().id;

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
    marketMetrics.protocol = getOrCreateLendingProtocol().id;
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
    financialMetrics.protocol = getOrCreateLendingProtocol().id;

    financialMetrics.totalRevenueUSD = BIGDECIMAL_ZERO;
    financialMetrics.totalValueLockedUSD = BIGDECIMAL_ZERO;
    financialMetrics.supplySideRevenueUSD = BIGDECIMAL_ZERO;
    financialMetrics.protocolSideRevenueUSD = BIGDECIMAL_ZERO;
    financialMetrics.save();
  }
  return financialMetrics;
}

////////////////////////////
///// Lending Specific /////
///////////////////////////

export function getOrCreateLendingProtocol(): LendingProtocol {
  let LendingProtocolEntity = LendingProtocol.load(VAT_ADDRESS);
  if (LendingProtocolEntity) {
    return LendingProtocolEntity;
  }
  LendingProtocolEntity = new LendingProtocol(VAT_ADDRESS);
  LendingProtocolEntity.name = "MakerDao";
  LendingProtocolEntity.slug = "makerdao";
  LendingProtocolEntity.schemaVersion = "1.1.0";
  LendingProtocolEntity.subgraphVersion = "0.0.6";
  LendingProtocolEntity.methodologyVersion = "0.0.1";
  LendingProtocolEntity.network = Network.ETHEREUM;
  LendingProtocolEntity.type = ProtocolType.LENDING;
  LendingProtocolEntity.totalUniqueUsers = 0;
  LendingProtocolEntity.totalValueLockedUSD = BIGDECIMAL_ZERO;
  LendingProtocolEntity.lendingType = LendingType.CDP;
  LendingProtocolEntity.save();
  return LendingProtocolEntity;
}

///////////////////////////
///////// Helpers /////////
///////////////////////////

function getIlkMarketAddress(ilk:Bytes): string {
  let ilkEntity = _Ilk.load(ilk.toString())
  if (!ilkEntity){
    return ZERO_ADDRESS
  }
  return ilkEntity.marketAddress
}


export function getMarketFromIlk(ilk: Bytes): Market {
  let marketAddress = getIlkMarketAddress(ilk)
  let market = Market.load(marketAddress);
  if (market) {
    return market;
  }
  return new Market(marketAddress);
}

export function getMarket(marketAddress: string): Market {
  let market = Market.load(marketAddress);
  if (market) {
    return market;
  }
  return new Market(marketAddress);
}

export function getProxy(proxyAddress:Address): _Proxy {
  let proxy = _Proxy.load(proxyAddress.toHexString())
  if(!proxy){
    proxy = new _Proxy(proxyAddress.toHexString())
    let ownerCall = DsProxy.bind(proxyAddress).try_owner()
    if (!ownerCall.reverted){
      proxy.owner = ownerCall.value.toHexString()
    } else {
      proxy.owner = ZERO_ADDRESS
    }
    proxy.save()
  }
  return proxy
}
