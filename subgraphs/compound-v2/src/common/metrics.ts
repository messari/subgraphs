// update snapshots and metrics
import {
  getOrCreateFinancials,
  getOrCreateLendingProtcol,
  getOrCreateMarket,
  getOrCreateMarketDailySnapshot,
  getOrCreateUsageMetricSnapshot,
} from "./getters";
import { Address, ethereum } from "@graphprotocol/graph-ts";
import { Account, DailyActiveAccount } from "../../generated/schema";
import { SECONDS_PER_DAY } from "./utils/constants";
import { BIGDECIMAL_ZERO } from "./prices/common/constants";

///////////////////////////
//// Snapshot Entities ////
///////////////////////////

// updates a given FinancialDailySnapshot Entity
export function updateFinancials(event: ethereum.Event): void {
  // number of days since unix epoch
  let financialMetrics = getOrCreateFinancials(event);
  let protocol = getOrCreateLendingProtcol();

  // update value/volume vars
  financialMetrics.totalValueLockedUSD = protocol.totalValueLockedUSD;
  financialMetrics.totalVolumeUSD = protocol.totalVolumeUSD;
  financialMetrics.totalDepositUSD = protocol.totalDepositUSD;
  financialMetrics.totalBorrowUSD = protocol.totalBorrowUSD;

  if (event.block.number > financialMetrics.blockNumber) {
    // only add to revenues if the financialMetrics has not seen this block number
    let supplyRevenue = BIGDECIMAL_ZERO;
    let protocolRevenue = BIGDECIMAL_ZERO;
    let totalRevenue = BIGDECIMAL_ZERO;
    for (let i = 0; i < protocol._marketIds.length; i++) {
      let market = getOrCreateMarket(event, event.address);

      supplyRevenue = supplyRevenue.plus(market._supplySideRevenueUSD);
      protocolRevenue = protocolRevenue.plus(market._protocolSideRevenueUSD);
      totalRevenue = totalRevenue.plus(market._totalRevenueUSD);
    }
    financialMetrics.supplySideRevenueUSD = supplyRevenue;
    financialMetrics.protocolSideRevenueUSD = protocolRevenue;
    financialMetrics.totalRevenueUSD = totalRevenue;
  }

  // update the block number and timestamp
  financialMetrics.blockNumber = event.block.number;
  financialMetrics.timestamp = event.block.timestamp;

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
  let account = Account.load(accountId);
  let protocol = getOrCreateLendingProtcol();
  if (!account) {
    account = new Account(accountId);
    account.save();

    protocol.totalUniqueUsers += 1;
    protocol.save();
  }
  usageMetrics.totalUniqueUsers = protocol.totalUniqueUsers;

  // Combine the id and the user address to generate a unique user id for the day
  let dailyActiveAccountId = id.toString() + "-" + from.toHexString();
  let dailyActiveAccount = DailyActiveAccount.load(dailyActiveAccountId);
  if (!dailyActiveAccount) {
    dailyActiveAccount = new DailyActiveAccount(dailyActiveAccountId);
    dailyActiveAccount.save();
    usageMetrics.activeUsers += 1;
  }

  usageMetrics.save();
}

// update a given MarketDailySnapshot
export function updateMarketMetrics(event: ethereum.Event): void {
  // Number of days since Unix epoch
  let marketMetrics = getOrCreateMarketDailySnapshot(event);
  let market = getOrCreateMarket(event, event.address);

  // update to latest block/timestamp
  marketMetrics.blockNumber = event.block.number;
  marketMetrics.timestamp = event.block.timestamp;

  // update other vars
  marketMetrics.totalValueLockedUSD = market.totalValueLockedUSD;
  marketMetrics.inputTokenBalances = market.inputTokenBalances;
  let inputTokenPrices = marketMetrics.inputTokenPricesUSD;
  inputTokenPrices[0] = market.inputTokenPricesUSD[0];
  marketMetrics.inputTokenPricesUSD = inputTokenPrices;
  marketMetrics.outputTokenSupply = market.outputTokenSupply;
  marketMetrics.outputTokenPriceUSD = market.outputTokenPriceUSD;
  marketMetrics.rewardTokenEmissionsAmount = market.rewardTokenEmissionsAmount;
  marketMetrics.rewardTokenEmissionsUSD = market.rewardTokenEmissionsUSD;

  // lending-specific vars
  marketMetrics.depositRate = market.depositRate;
  marketMetrics.variableBorrowRate = market.variableBorrowRate;

  marketMetrics.save();
}
