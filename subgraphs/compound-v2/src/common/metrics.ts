// update snapshots and metrics
import {
  getOrCreateFinancials,
  getOrCreateLendingProtcol,
  getOrCreateMarket,
  getOrCreateMarketDailySnapshot,
  getOrCreateToken,
  getOrCreateUsageMetricSnapshot,
} from "./getters";
import { Address, ethereum } from "@graphprotocol/graph-ts";
import { _Account, _DailyActiveAccount } from "../types/schema";
import { BIGDECIMAL_ONE, BIGDECIMAL_ZERO, SECONDS_PER_DAY } from "./utils/constants";
import { exponentToBigDecimal } from "./utils/utils";

///////////////////////////
//// Snapshot Entities ////
///////////////////////////

// updates a given FinancialDailySnapshot Entity
export function updateFinancials(event: ethereum.Event): void {
  // number of days since unix epoch
  let id: i64 = event.block.timestamp.toI64() / SECONDS_PER_DAY;
  let financialMetrics = getOrCreateFinancials(event);
  let protocol = getOrCreateLendingProtcol();

  // update the block number and timestamp
  financialMetrics.blockNumber = event.block.number;
  financialMetrics.timestamp = event.block.timestamp;

  // update value/volume vars
  financialMetrics.totalValueLockedUSD = protocol.totalValueLockedUSD;
  financialMetrics.totalVolumeUSD = protocol._totalVolumeUSD;

  // calculate supply-side revenue and protocol-side revenue
  let supplySideRevenue = BIGDECIMAL_ZERO;
  let protocolSideRevenue = BIGDECIMAL_ZERO;
  let feesUSD = BIGDECIMAL_ZERO; // aka Total revenue = market outstanding borrows * market borrow rate
  for (let i = 0; i < protocol._marketIds.length; i++) {
    let market = getOrCreateMarket(event, Address.fromString(protocol._marketIds[i]));
    let underlyingDecimals = getOrCreateToken(market.inputTokens[0]).decimals;
    let outstandingBorrowUSD = market._outstandingBorrowAmount
      .toBigDecimal()
      .div(exponentToBigDecimal(underlyingDecimals))
      .times(market._inputTokenPrice);
    supplySideRevenue = outstandingBorrowUSD
      .times(market.variableBorrowRate)
      .times(BIGDECIMAL_ONE.minus(market._reserveFactor))
      .plus(supplySideRevenue);
    protocolSideRevenue = outstandingBorrowUSD
      .times(market.variableBorrowRate)
      .times(market._reserveFactor)
      .plus(protocolSideRevenue);
    feesUSD = outstandingBorrowUSD.times(market.variableBorrowRate).plus(feesUSD);
  }
  financialMetrics.supplySideRevenueUSD = supplySideRevenue;
  financialMetrics.protocolSideRevenueUSD = protocolSideRevenue;

  // calculate fees = totalRevenue
  financialMetrics.feesUSD = feesUSD;

  financialMetrics.save();
}

// update a given UsageMetricDailySnapshot
export function updateUsageMetrics(event: ethereum.Event, from: Address): void {
  // Number of days since Unix epoch
  let id: i64 = event.block.timestamp.toI64() / SECONDS_PER_DAY;
  let usageMetrics = getOrCreateUsageMetricSnapshot(event);

  // Update the block number and timestamp to that of the last transaction of that day
  usageMetrics.blockNumber = event.block.number;
  usageMetrics.timestamp = event.block.timestamp;
  usageMetrics.dailyTransactionCount += 1;

  let accountId = from.toHexString();
  let account = _Account.load(accountId);
  let protocol = getOrCreateLendingProtcol();
  if (!account) {
    account = new _Account(accountId);
    account.save();

    protocol.totalUniqueUsers += 1;
    protocol.save();
  }
  usageMetrics.totalUniqueUsers = protocol.totalUniqueUsers;

  // Combine the id and the user address to generate a unique user id for the day
  let dailyActiveAccountId = id.toString() + "-" + from.toHexString();
  let dailyActiveAccount = _DailyActiveAccount.load(dailyActiveAccountId);
  if (!dailyActiveAccount) {
    dailyActiveAccount = new _DailyActiveAccount(dailyActiveAccountId);
    dailyActiveAccount.save();
    usageMetrics.activeUsers += 1;
  }

  usageMetrics.save();
}

// update a given MarketDailySnapshot
export function updateMarketMetrics(event: ethereum.Event): void {
  // Number of days since Unix epoch
  let id: i64 = event.block.timestamp.toI64() / SECONDS_PER_DAY;
  let marketMetrics = getOrCreateMarketDailySnapshot(event);
  let market = getOrCreateMarket(event, event.address);

  // update to latest block/timestamp
  marketMetrics.blockNumber = event.block.number;
  marketMetrics.timestamp = event.block.timestamp;

  // update other vars
  marketMetrics.totalValueLockedUSD = market.totalValueLockedUSD;
  marketMetrics.inputTokenBalances = market.inputTokenBalances;
  let inputTokenPrices = marketMetrics.inputTokenPricesUSD;
  inputTokenPrices[0] = market._inputTokenPrice;
  marketMetrics.inputTokenPricesUSD = inputTokenPrices;
  marketMetrics.outputTokenSupply = market.outputTokenSupply;
  marketMetrics.outputTokenPriceUSD = market.outputTokenPriceUSD;
  marketMetrics.rewardTokenEmissionsAmount = market.rewardTokenEmissionsAmount;
  marketMetrics.rewardTokenEmissionsUSD = market.rewardTokenEmissionsUSD;

  // lending-specific vars
  marketMetrics.depositRate = market.depositRate;
  marketMetrics.stableBorrowRate = market.stableBorrowRate;
  marketMetrics.variableBorrowRate = market.variableBorrowRate;

  marketMetrics.save();
}
