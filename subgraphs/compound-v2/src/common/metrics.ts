// update snapshots and metrics

import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { _Account, _DailyActiveAccount } from "../types/schema";
import { getOrCreateFinancials, getOrCreateLendingProtcol, getOrCreateUsageMetricSnapshot } from "./getters";
import { SECONDS_PER_DAY } from "./utils/constants";

///////////////////////////
//// Snapshot Entities ////
///////////////////////////

// updates a given FinancialDailySnapshot Entity
export function updateFinancials(event: ethereum.Event, borrowedAmount: BigInt): void {
  // number of days since unix epoch
  let id: i64 = event.block.timestamp.toI64() / SECONDS_PER_DAY;
  let financialMetrics = getOrCreateFinancials(event);
  let protocol = getOrCreateLendingProtcol();

  // update the block number and timestamp
  financialMetrics.blockNumber = event.block.number;
  financialMetrics.timestamp = event.block.timestamp;
  // keep track of TVL at each day
  financialMetrics.totalValueLockedUSD = protocol.totalValueLockedUSD;
  // keep track of volume in a given day
  // financialMetrics.totalVolumeUSD = financialMetrics.totalVolumeU
  // financialMetrics.supplySideRevenueUSD =

  // let financialMetrics = getOrCreateFinancials(event);
  // let protocol = getOrCreateDexAmm();
  // // Update the block number and timestamp to that of the last transaction of that day
  // financialMetrics.blockNumber = event.block.number;
  // financialMetrics.timestamp = event.block.timestamp;
  // financialMetrics.totalValueLockedUSD = protocol.totalValueLockedUSD;
  // ...
  // financialMetrics.save();
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
  // get or create pool metrics
  // let marketMetrics = getOrCreatePoolDailySnapshot(event);
  // let pool = getLiquidityPool(event.address.toHexString());
  // // Update the block number and timestamp to that of the last transaction of that day
  // marketMetrics.totalValueLockedUSD = pool.totalValueLockedUSD;
  // marketMetrics.inputTokenBalances = pool.inputTokenBalances;
  // marketMetrics.outputTokenSupply = pool.outputTokenSupply;
  // marketMetrics.outputTokenPriceUSD = pool.outputTokenPriceUSD;
  // marketMetrics.blockNumber = event.block.number;
  // marketMetrics.timestamp = event.block.timestamp;
  // ...
  // marketMetrics.save();
}

////////////////////////
//// Other Entities ////
////////////////////////

// export function up
