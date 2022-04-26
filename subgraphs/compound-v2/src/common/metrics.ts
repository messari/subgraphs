// update snapshots and metrics
import {
  getOrCreateFinancials,
  getOrCreateLendingProtcol,
  getOrCreateMarket,
  getOrCreateMarketDailySnapshot,
  getOrCreateUsageDailySnapshot,
  getOrCreateUsageHourlySnapshot,
} from "./getters";
import { Address, ethereum } from "@graphprotocol/graph-ts";
import { Account, ActiveAccount, UsageMetricsDailySnapshot, UsageMetricsHourlySnapshot } from "../../generated/schema";
import { SECONDS_PER_DAY, SECONDS_PER_HOUR } from "./utils/constants";
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

  let supplyRevenue = BIGDECIMAL_ZERO;
  let protocolRevenue = BIGDECIMAL_ZERO;
  let totalRevenue = BIGDECIMAL_ZERO;
  for (let i = 0; i < protocol._marketIds.length; i++) {
    let market = getOrCreateMarket(event, Address.fromString(protocol._marketIds[i]));

    supplyRevenue = supplyRevenue.plus(market._supplySideRevenueUSD);
    protocolRevenue = protocolRevenue.plus(market._protocolSideRevenueUSD);
    totalRevenue = totalRevenue.plus(market._totalRevenueUSD);
  }
  financialMetrics.supplySideRevenueUSD = supplyRevenue;
  financialMetrics.protocolSideRevenueUSD = protocolRevenue;
  financialMetrics.totalRevenueUSD = totalRevenue;

  // update the block number and timestamp
  financialMetrics.blockNumber = event.block.number;
  financialMetrics.timestamp = event.block.timestamp;

  financialMetrics.save();
}

// update a given UsageMetricDailySnapshot
export function updateUsageMetrics(event: ethereum.Event, from: Address, transaction: String): void {
  // Number of days since Unix epoch
  let id: i64 = event.block.timestamp.toI64() / SECONDS_PER_DAY;
  let hour: i64 = (event.block.timestamp.toI64() - (id * SECONDS_PER_DAY)) / SECONDS_PER_HOUR;
  let dailyMetrics = getOrCreateUsageDailySnapshot(event);
  let hourlyMetrics = getOrCreateUsageHourlySnapshot(event);

  // Update the block number and timestamp to that of the last transaction of that day
  dailyMetrics.blockNumber = event.block.number;
  dailyMetrics.timestamp = event.block.timestamp;
  dailyMetrics.dailyTransactionCount += 1;

  // update hourlyMetrics
  hourlyMetrics.blockNumber = event.block.number;
  hourlyMetrics.timestamp = event.block.timestamp;
  hourlyMetrics.hourlyTransactionCount += 1;

  let accountId = from.toHexString();
  let account = Account.load(accountId);
  let protocol = getOrCreateLendingProtcol();
  if (!account) {
    account = new Account(accountId);
    account.save();

    protocol.cumulativeUniqueUsers += 1;
    protocol.save();
  }
  hourlyMetrics.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers;
  dailyMetrics.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers;

  // Combine the id and the user address to generate a unique user id for the day
  let dailyActiveAccountId = from.toHexString() + "-" + id.toString();
  let dailyActiveAccount = ActiveAccount.load(dailyActiveAccountId);
  if (!dailyActiveAccount) {
    dailyActiveAccount = new ActiveAccount(dailyActiveAccountId);
    dailyActiveAccount.save();
    dailyMetrics.dailyActiveUsers += 1;
  }

  // create active account for hourlyMetrics
  let hourlyActiveAccountId = dailyActiveAccountId + "-" + hour.toString();
  let hourlyActiveAccount = ActiveAccount.load(hourlyActiveAccountId);
  if (!hourlyActiveAccount) {
    hourlyActiveAccount = new ActiveAccount(hourlyActiveAccountId);
    hourlyActiveAccount.save();
    hourlyMetrics.hourlyActiveUsers += 1;
  }

  // update transaction for daily/hourly metrics
  updateTransactionCount(dailyMetrics, hourlyMetrics, transaction);

  hourlyMetrics.save();
  dailyMetrics.save();
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

/////////////////
//// Helpers ////
/////////////////

function updateTransactionCount(
  dailyUsage: UsageMetricsDailySnapshot, 
  hourlyUsage: UsageMetricsHourlySnapshot, 
  transaction: String): void {
    if (transaction == "deposit") {
      hourlyUsage.hourlyDepositCount += 1;
      dailyUsage.dailyDepositCount += 1;
    } else if (transaction == "withdraw") {
      hourlyUsage.hourlyWithdrawCount += 1;
      dailyUsage.dailyWithdrawCount += 1;
    } else if (transaction == "borrow") {
      hourlyUsage.hourlyBorrowCount += 1;
      dailyUsage.dailyBorrowCount += 1;
    } else if (transaction == "repay") {
      hourlyUsage.hourlyRepayCount += 1;
      dailyUsage.dailyRepayCount += 1;
    } else if (transaction == "liquidate") {
      hourlyUsage.hourlyLiquidateCount += 1;
      dailyUsage.dailyLiquidateCount += 1;
    }

    hourlyUsage.save();
    dailyUsage.save();
}
