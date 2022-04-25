// import { log } from "@graphprotocol/graph-ts"
import { Address, Bytes, ethereum } from "@graphprotocol/graph-ts";
import {
  Token,
  UsageMetricsDailySnapshot,
  FinancialsDailySnapshot,
  MarketDailySnapshot,
  LendingProtocol,
  Market,
  _Ilk,
  _Proxy,
  InterestRate,
  MarketHourlySnapshot,
  UsageMetricsHourlySnapshot,
} from "../../generated/schema";
import { fetchTokenSymbol, fetchTokenName, fetchTokenDecimals } from "./tokens";
import {
  BIGDECIMAL_ZERO,
  ProtocolType,
  SECONDS_PER_DAY,
  LendingType,
  VAT_ADDRESS,
  ZERO_ADDRESS,
  BIGDECIMAL_ONE,
  DAI,
  SECONDS_PER_HOUR,
  BIGINT_ZERO,
  Network,
  InterestRateSide,
  InterestRateType,
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

export function getOrCreateUsageMetricsHourlySnapshot(event: ethereum.Event): UsageMetricsHourlySnapshot {
  // Number of days since Unix epoch
  let id: i64 = event.block.timestamp.toI64() / SECONDS_PER_HOUR;

  // Create unique id for the day
  let usageMetrics = UsageMetricsHourlySnapshot.load(id.toString());

  if (!usageMetrics) {
    usageMetrics = new UsageMetricsHourlySnapshot(id.toString());
    usageMetrics.protocol = getOrCreateLendingProtocol().id;
    usageMetrics.hourlyActiveUsers = 0;
    usageMetrics.cumulativeUniqueUsers = 0;
    usageMetrics.hourlyTransactionCount = 0;
    usageMetrics.hourlyDepositCount = 0;
    usageMetrics.hourlyBorrowCount = 0;
    usageMetrics.hourlyWithdrawCount = 0;
    usageMetrics.hourlyRepayCount = 0;
    usageMetrics.hourlyLiquidateCount = 0;
    usageMetrics.save();
  }
  return usageMetrics;
}

export function getOrCreateUsageMetricsDailySnapshot(event: ethereum.Event): UsageMetricsDailySnapshot {
  // Number of days since Unix epoch
  let id: i64 = event.block.timestamp.toI64() / SECONDS_PER_DAY;

  // Create unique id for the day
  let usageMetrics = UsageMetricsDailySnapshot.load(id.toString());

  if (!usageMetrics) {
    usageMetrics = new UsageMetricsDailySnapshot(id.toString());
    usageMetrics.protocol = getOrCreateLendingProtocol().id;
    usageMetrics.dailyActiveUsers = 0;
    usageMetrics.cumulativeUniqueUsers = 0;
    usageMetrics.dailyTransactionCount = 0;
    usageMetrics.dailyDepositCount = 0;
    usageMetrics.dailyBorrowCount = 0;
    usageMetrics.dailyWithdrawCount = 0;
    usageMetrics.dailyRepayCount = 0;
    usageMetrics.dailyLiquidateCount = 0;
    usageMetrics.save();
  }
  return usageMetrics;
}

export function getOrCreateMarketHourlySnapshot(event: ethereum.Event, marketAddress: string): MarketHourlySnapshot {
  let id: i64 = event.block.timestamp.toI64() / SECONDS_PER_HOUR;
  let marketMetrics = MarketHourlySnapshot.load(marketAddress.concat("-").concat(id.toString()));

  if (!marketMetrics) {
    marketMetrics = new MarketHourlySnapshot(marketAddress.concat("-").concat(id.toString()));
    marketMetrics.protocol = getOrCreateLendingProtocol().id;
    marketMetrics.market = marketAddress;
    marketMetrics.inputTokenBalance = BIGINT_ZERO;
    marketMetrics.outputTokenSupply = BIGINT_ZERO;
    marketMetrics.totalValueLockedUSD = BIGDECIMAL_ZERO;
    marketMetrics.totalDepositBalanceUSD = BIGDECIMAL_ZERO;
    marketMetrics.hourlyDepositUSD = BIGDECIMAL_ZERO;
    marketMetrics.cumulativeDepositUSD = BIGDECIMAL_ZERO;
    marketMetrics.totalBorrowBalanceUSD = BIGDECIMAL_ZERO;
    marketMetrics.hourlyBorrowUSD = BIGDECIMAL_ZERO;
    marketMetrics.cumulativeBorrowUSD = BIGDECIMAL_ZERO;
    marketMetrics.hourlyLiquidateUSD = BIGDECIMAL_ZERO;
    marketMetrics.cumulativeLiquidateUSD = BIGDECIMAL_ZERO;
    marketMetrics.save();
  }

  return marketMetrics;
}

export function getOrCreateMarketDailySnapshot(event: ethereum.Event, marketAddress: string): MarketDailySnapshot {
  let id: i64 = event.block.timestamp.toI64() / SECONDS_PER_DAY;
  let marketMetrics = MarketDailySnapshot.load(marketAddress.concat("-").concat(id.toString()));

  if (!marketMetrics) {
    marketMetrics = new MarketDailySnapshot(marketAddress.concat("-").concat(id.toString()));
    marketMetrics.protocol = getOrCreateLendingProtocol().id;
    marketMetrics.market = marketAddress;
    marketMetrics.inputTokenBalance = BIGINT_ZERO;
    marketMetrics.outputTokenSupply = BIGINT_ZERO;
    marketMetrics.totalValueLockedUSD = BIGDECIMAL_ZERO;
    marketMetrics.totalDepositBalanceUSD = BIGDECIMAL_ZERO;
    marketMetrics.dailyDepositUSD = BIGDECIMAL_ZERO;
    marketMetrics.cumulativeDepositUSD = BIGDECIMAL_ZERO;
    marketMetrics.totalBorrowBalanceUSD = BIGDECIMAL_ZERO;
    marketMetrics.dailyBorrowUSD = BIGDECIMAL_ZERO;
    marketMetrics.cumulativeBorrowUSD = BIGDECIMAL_ZERO;
    marketMetrics.dailyLiquidateUSD = BIGDECIMAL_ZERO;
    marketMetrics.cumulativeLiquidateUSD = BIGDECIMAL_ZERO;
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
    financialMetrics.totalValueLockedUSD = BIGDECIMAL_ZERO;
    financialMetrics.dailySupplySideRevenueUSD = BIGDECIMAL_ZERO;
    financialMetrics.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
    financialMetrics.dailyProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    financialMetrics.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    financialMetrics.dailyTotalRevenueUSD = BIGDECIMAL_ZERO;
    financialMetrics.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;
    financialMetrics.totalBorrowBalanceUSD = BIGDECIMAL_ZERO;
    financialMetrics.cumulativeBorrowUSD = BIGDECIMAL_ZERO;
    financialMetrics.totalDepositBalanceUSD = BIGDECIMAL_ZERO;
    financialMetrics.cumulativeDepositUSD = BIGDECIMAL_ZERO;
    financialMetrics.cumulativeLiquidateUSD = BIGDECIMAL_ZERO;
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
  LendingProtocolEntity.network = Network.MAINNET;
  LendingProtocolEntity.type = ProtocolType.LENDING;
  LendingProtocolEntity.cumulativeUniqueUsers = 0;
  LendingProtocolEntity.totalValueLockedUSD = BIGDECIMAL_ZERO;
  LendingProtocolEntity.lendingType = LendingType.CDP;
  LendingProtocolEntity.mintedTokens = [getOrCreateToken(Address.fromString(DAI)).id]
  LendingProtocolEntity.save();
  return LendingProtocolEntity;
}

///////////////////////////
///////// Helpers /////////
///////////////////////////

function getIlkMarketAddress(ilk: Bytes): string {
  let ilkEntity = _Ilk.load(ilk.toString());
  if (!ilkEntity) {
    return ZERO_ADDRESS;
  }
  return ilkEntity.marketAddress;
}

export function getMarketFromIlk(ilk: Bytes): Market {
  let marketAddress = getIlkMarketAddress(ilk);
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

export function getProxy(proxyAddress: Address): _Proxy {
  let proxy = _Proxy.load(proxyAddress.toHexString());
  if (!proxy) {
    proxy = new _Proxy(proxyAddress.toHexString());
    let ownerCall = DsProxy.bind(proxyAddress).try_owner();
    if (!ownerCall.reverted) {
      proxy.owner = ownerCall.value.toHexString();
    } else {
      proxy.owner = ZERO_ADDRESS;
    }
    proxy.save();
  }
  return proxy;
}

export function getOrCreateInterestRate(marketAddress:string): InterestRate {
  let interestRate = InterestRate.load("BORROWER-" + "STABLE-" + marketAddress);
  if (interestRate){
    return interestRate
  }
  interestRate = new InterestRate("BORROWER-" + "STABLE-" + marketAddress);
  interestRate.side = InterestRateSide.BORROW;
  interestRate.type = InterestRateType.STABLE;
  interestRate.rate = BIGDECIMAL_ONE;
  interestRate.save();
  return interestRate
}