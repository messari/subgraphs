// update snapshots and metrics
import {
  getOrCreateFinancials,
  getOrCreateLendingProtcol,
  getOrCreateMarket,
  getOrCreateMarketDailySnapshot,
  getOrCreateMarketHourlySnapshot,
  getOrCreateRate,
  getOrCreateUsageDailySnapshot,
  getOrCreateUsageHourlySnapshot,
} from "./getters";
import { Address, ethereum } from "@graphprotocol/graph-ts";
import {
  Account,
  ActiveAccount,
  InterestRate,
  UsageMetricsDailySnapshot,
  UsageMetricsHourlySnapshot,
} from "../../generated/schema";
import { SECONDS_PER_DAY, SECONDS_PER_HOUR, TransactionType } from "./utils/constants";

///////////////////////////
//// Snapshot Entities ////
///////////////////////////

// updates a given FinancialDailySnapshot Entity
export function updateFinancials(event: ethereum.Event): void {
  // number of days since unix epoch
  let financialMetrics = getOrCreateFinancials(event);
  let protocol = getOrCreateLendingProtcol();

  // update vars
  financialMetrics.totalValueLockedUSD = protocol.totalValueLockedUSD;
  financialMetrics.totalDepositBalanceUSD = protocol.totalDepositBalanceUSD;
  financialMetrics.cumulativeDepositUSD = protocol.cumulativeDepositUSD;
  financialMetrics.totalBorrowBalanceUSD = protocol.totalBorrowBalanceUSD;
  financialMetrics.cumulativeBorrowUSD = protocol.cumulativeBorrowUSD;
  financialMetrics.cumulativeLiquidateUSD = protocol.cumulativeLiquidateUSD;
  // Note: daily balances updated in respective functions in helpers.ts

  // update revenues
  financialMetrics.cumulativeSupplySideRevenueUSD = protocol.cumulativeSupplySideRevenueUSD;
  financialMetrics.cumulativeProtocolSideRevenueUSD = protocol.cumulativeProtocolSideRevenueUSD;
  financialMetrics.cumulativeTotalRevenueUSD = protocol.cumulativeTotalRevenueUSD;
  // Note: daily revenue calculations done in helpers.ts:updatePrevBlockRevenues()

  // update the block number and timestamp
  financialMetrics.blockNumber = event.block.number;
  financialMetrics.timestamp = event.block.timestamp;

  financialMetrics.save();
}

// update a given UsageMetricDailySnapshot
export function updateUsageMetrics(event: ethereum.Event, from: Address, transaction: string): void {
  // Number of days since Unix epoch
  let id: i64 = event.block.timestamp.toI64() / SECONDS_PER_DAY;
  let hour: i64 = (event.block.timestamp.toI64() - id * SECONDS_PER_DAY) / SECONDS_PER_HOUR;
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
export function updateMarketDailyMetrics(event: ethereum.Event): void {
  let marketMetrics = getOrCreateMarketDailySnapshot(event);
  let market = getOrCreateMarket(event, event.address);

  // update to latest block/timestamp
  marketMetrics.blockNumber = event.block.number;
  marketMetrics.timestamp = event.block.timestamp;

  // update other vars
  marketMetrics.totalValueLockedUSD = market.totalValueLockedUSD;
  marketMetrics.totalDepositBalanceUSD = market.totalDepositBalanceUSD;
  marketMetrics.cumulativeDepositUSD = market.cumulativeDepositUSD;
  marketMetrics.totalBorrowBalanceUSD = market.totalBorrowBalanceUSD;
  marketMetrics.cumulativeBorrowUSD = market.cumulativeBorrowUSD;
  marketMetrics.cumulativeLiquidateUSD = market.cumulativeLiquidateUSD;
  marketMetrics.inputTokenBalance = market.inputTokenBalance;
  marketMetrics.inputTokenPriceUSD = market.inputTokenPriceUSD;
  marketMetrics.outputTokenSupply = market.outputTokenSupply;
  marketMetrics.outputTokenPriceUSD = market.outputTokenPriceUSD;
  marketMetrics.exchangeRate = market.exchangeRate;
  marketMetrics.rewardTokenEmissionsAmount = market.rewardTokenEmissionsAmount;
  marketMetrics.rewardTokenEmissionsUSD = market.rewardTokenEmissionsUSD;
  // Note: daily tracking of deposit/borrow/liquidate in respective functions in helpers.ts

  let identifier = market.id + "-" + (event.block.timestamp.toI64() / SECONDS_PER_DAY).toString();
  marketMetrics.rates = getSnapshotRates(market.rates, identifier);

  marketMetrics.save();
}

// update a given MarketHourlySnapshot
export function updateMarketHourlyMetrics(event: ethereum.Event): void {
  let marketMetrics = getOrCreateMarketHourlySnapshot(event);
  let market = getOrCreateMarket(event, event.address);

  // update to latest block/timestamp
  marketMetrics.blockNumber = event.block.number;
  marketMetrics.timestamp = event.block.timestamp;

  // update other vars
  marketMetrics.totalValueLockedUSD = market.totalValueLockedUSD;
  marketMetrics.totalDepositBalanceUSD = market.totalDepositBalanceUSD;
  marketMetrics.cumulativeDepositUSD = market.cumulativeDepositUSD;
  marketMetrics.totalBorrowBalanceUSD = market.totalBorrowBalanceUSD;
  marketMetrics.cumulativeBorrowUSD = market.cumulativeBorrowUSD;
  marketMetrics.cumulativeLiquidateUSD = market.cumulativeLiquidateUSD;
  marketMetrics.inputTokenBalance = market.inputTokenBalance;
  marketMetrics.inputTokenPriceUSD = market.inputTokenPriceUSD;
  marketMetrics.outputTokenSupply = market.outputTokenSupply;
  marketMetrics.outputTokenPriceUSD = market.outputTokenPriceUSD;
  marketMetrics.exchangeRate = market.exchangeRate;
  marketMetrics.rewardTokenEmissionsAmount = market.rewardTokenEmissionsAmount;
  marketMetrics.rewardTokenEmissionsUSD = market.rewardTokenEmissionsUSD;
  // Note: hourly tracking of deposit/borrow/liquidate in respective functions in helpers.ts

  let identifier = market.id + "-" + (event.block.timestamp.toI64() / SECONDS_PER_HOUR).toString();
  marketMetrics.rates = getSnapshotRates(market.rates, identifier);

  marketMetrics.save();
}

/////////////////
//// Helpers ////
/////////////////

function updateTransactionCount(
  dailyUsage: UsageMetricsDailySnapshot,
  hourlyUsage: UsageMetricsHourlySnapshot,
  transaction: string,
): void {
  if (transaction == TransactionType.DEPOSIT) {
    hourlyUsage.hourlyDepositCount += 1;
    dailyUsage.dailyDepositCount += 1;
  } else if (transaction == TransactionType.WITHDRAW) {
    hourlyUsage.hourlyWithdrawCount += 1;
    dailyUsage.dailyWithdrawCount += 1;
  } else if (transaction == TransactionType.BORROW) {
    hourlyUsage.hourlyBorrowCount += 1;
    dailyUsage.dailyBorrowCount += 1;
  } else if (transaction == TransactionType.REPAY) {
    hourlyUsage.hourlyRepayCount += 1;
    dailyUsage.dailyRepayCount += 1;
  } else if (transaction == TransactionType.LIQUIDATE) {
    hourlyUsage.hourlyLiquidateCount += 1;
    dailyUsage.dailyLiquidateCount += 1;
  }

  hourlyUsage.save();
  dailyUsage.save();
}

// create seperate InterestRate Entities for each market snapshot
// this is needed to prevent snapshot rates from being pointers to the current rate
function getSnapshotRates(rates: string[], identifier: string): string[] {
  let snapshotRates: string[] = [];
  for (let i = 0; i < rates.length; i++) {
    let actualRate = InterestRate.load(rates[i]);

    // get/create new snapshot rate
    let _rate = getOrCreateRate(actualRate!.side, actualRate!.type, identifier);

    // update rate to current rate
    _rate.rate = actualRate!.rate;
    _rate.save();
    snapshotRates.push(_rate.id);
  }
  return snapshotRates;
}
