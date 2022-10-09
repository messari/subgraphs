// update snapshots and metrics
import {
  getOrCreateFinancials,
  getOrCreateLendingProtocol,
  getOrCreateMarket,
  getOrCreateMarketDailySnapshot,
  getOrCreateMarketHourlySnapshot,
  getOrCreateUsageDailySnapshot,
  getOrCreateUsageHourlySnapshot,
} from "./getters";
import { Address, BigDecimal, ethereum } from "@graphprotocol/graph-ts";
import { Account, ActiveAccount, UsageMetricsDailySnapshot, UsageMetricsHourlySnapshot } from "../../generated/schema";
import { ActivityType, SECONDS_PER_DAY, SECONDS_PER_HOUR, TransactionType } from "./constants";

// updates a given FinancialDailySnapshot Entity
export function updateFinancials(block: ethereum.Block, amountUSD: BigDecimal, eventType: string | null = null): void {
  const financialMetrics = getOrCreateFinancials(block.timestamp, block.number);
  if (block.timestamp.ge(financialMetrics.timestamp)) {
    const protocol = getOrCreateLendingProtocol();
    // financials snapshot already exists and is stale
    financialMetrics.totalValueLockedUSD = protocol.totalValueLockedUSD;
    financialMetrics.totalDepositBalanceUSD = protocol.totalDepositBalanceUSD;
    financialMetrics.cumulativeDepositUSD = protocol.cumulativeDepositUSD;
    financialMetrics.totalBorrowBalanceUSD = protocol.totalBorrowBalanceUSD;
    financialMetrics.cumulativeBorrowUSD = protocol.cumulativeBorrowUSD;
    financialMetrics.cumulativeLiquidateUSD = protocol.cumulativeLiquidateUSD;

    // update cumul revenues
    financialMetrics.cumulativeSupplySideRevenueUSD = protocol.cumulativeSupplySideRevenueUSD;
    financialMetrics.cumulativeProtocolSideRevenueUSD = protocol.cumulativeProtocolSideRevenueUSD;
    financialMetrics.cumulativeTotalRevenueUSD = protocol.cumulativeTotalRevenueUSD;
  }

  // update the block number and timestamp
  financialMetrics.blockNumber = block.number;
  financialMetrics.timestamp = block.timestamp;

  if (eventType != null) {
    // add to daily amounts
    if (eventType == TransactionType.DEPOSIT) {
      financialMetrics.dailyDepositUSD = financialMetrics.dailyDepositUSD.plus(amountUSD);
    } else if (eventType == TransactionType.BORROW) {
      financialMetrics.dailyBorrowUSD = financialMetrics.dailyBorrowUSD.plus(amountUSD);
    } else if (eventType == TransactionType.REPAY) {
      financialMetrics.dailyRepayUSD = financialMetrics.dailyRepayUSD.plus(amountUSD);
    } else if (eventType == TransactionType.WITHDRAW) {
      financialMetrics.dailyWithdrawUSD = financialMetrics.dailyWithdrawUSD.plus(amountUSD);
    } else if (eventType == TransactionType.LIQUIDATE) {
      financialMetrics.dailyLiquidateUSD = financialMetrics.dailyLiquidateUSD.plus(amountUSD);
    }
  }

  financialMetrics.save();
}

// update a given UsageMetricDailySnapshot
export function updateUsageMetrics(event: ethereum.Event, from: Address, transaction: string): void {
  // Number of days since Unix epoch
  const id: i64 = event.block.timestamp.toI64() / SECONDS_PER_DAY;
  const hour: i64 = (event.block.timestamp.toI64() - id * SECONDS_PER_DAY) / SECONDS_PER_HOUR;
  const dailyMetrics = getOrCreateUsageDailySnapshot(event);
  const hourlyMetrics = getOrCreateUsageHourlySnapshot(event);

  // Update the block number and timestamp to that of the last transaction of that day
  dailyMetrics.blockNumber = event.block.number;
  dailyMetrics.timestamp = event.block.timestamp;
  dailyMetrics.dailyTransactionCount += 1;

  // update hourlyMetrics
  hourlyMetrics.blockNumber = event.block.number;
  hourlyMetrics.timestamp = event.block.timestamp;
  hourlyMetrics.hourlyTransactionCount += 1;

  const accountId = from.toHexString();
  let account = Account.load(accountId);
  const protocol = getOrCreateLendingProtocol();
  dailyMetrics.totalPoolCount = protocol.totalPoolCount;
  if (!account) {
    account = new Account(accountId);
    account.save();

    protocol.cumulativeUniqueUsers += 1;
    protocol.save();
  }
  hourlyMetrics.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers;
  dailyMetrics.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers;

  // Combine the id and the user address to generate a unique user id for the day
  const dailyActiveAccountId = ActivityType.DAILY + "-" + from.toHexString() + "-" + id.toString();
  let dailyActiveAccount = ActiveAccount.load(dailyActiveAccountId);
  if (!dailyActiveAccount) {
    dailyActiveAccount = new ActiveAccount(dailyActiveAccountId);
    dailyActiveAccount.save();
    dailyMetrics.dailyActiveUsers += 1;
  }

  // create active account for hourlyMetrics
  const hourlyActiveAccountId = ActivityType.HOURLY + "-" + from.toHexString() + "-" + hour.toString();
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
export function updateMarketMetrics(
  block: ethereum.Block,
  marketId: string,
  amountUSD: BigDecimal,
  eventType: string | null = null,
): void {
  const marketDailyMetrics = getOrCreateMarketDailySnapshot(block, marketId);
  const marketHourlyMetrics = getOrCreateMarketHourlySnapshot(block, marketId);

  //if (block.timestamp.ge(marketDailyMetrics.timestamp)) {
  //MarketDailySnapshot exists and is stale
  const market = getOrCreateMarket(marketId);
  marketDailyMetrics.totalValueLockedUSD = market.totalValueLockedUSD;
  marketDailyMetrics.cumulativeSupplySideRevenueUSD = market.cumulativeSupplySideRevenueUSD;
  marketDailyMetrics.cumulativeProtocolSideRevenueUSD = market.cumulativeProtocolSideRevenueUSD;
  marketDailyMetrics.cumulativeTotalRevenueUSD = market.cumulativeTotalRevenueUSD;
  marketDailyMetrics.totalDepositBalanceUSD = market.totalDepositBalanceUSD;
  marketDailyMetrics.cumulativeDepositUSD = market.cumulativeDepositUSD;
  marketDailyMetrics.totalBorrowBalanceUSD = market.totalBorrowBalanceUSD;
  marketDailyMetrics.cumulativeBorrowUSD = market.cumulativeBorrowUSD;
  marketDailyMetrics.cumulativeLiquidateUSD = market.cumulativeLiquidateUSD;
  marketDailyMetrics.inputTokenBalance = market.inputTokenBalance;
  marketDailyMetrics.inputTokenPriceUSD = market.inputTokenPriceUSD;
  marketDailyMetrics.outputTokenSupply = market.outputTokenSupply;
  marketDailyMetrics.outputTokenPriceUSD = market.outputTokenPriceUSD;
  marketDailyMetrics.exchangeRate = market.exchangeRate;
  marketDailyMetrics.rewardTokenEmissionsAmount = market.rewardTokenEmissionsAmount;
  marketDailyMetrics.rewardTokenEmissionsUSD = market.rewardTokenEmissionsUSD;
  //}

  //if (block.timestamp.ge(marketHourlyMetrics.timestamp)) {
  //MarketHourlySnapshot exists and is stale
  //const market = getOrCreateMarket(marketId);
  marketHourlyMetrics.totalValueLockedUSD = market.totalValueLockedUSD;
  marketHourlyMetrics.cumulativeSupplySideRevenueUSD = market.cumulativeSupplySideRevenueUSD;
  marketHourlyMetrics.cumulativeProtocolSideRevenueUSD = market.cumulativeProtocolSideRevenueUSD;
  marketHourlyMetrics.cumulativeTotalRevenueUSD = market.cumulativeTotalRevenueUSD;
  marketHourlyMetrics.totalDepositBalanceUSD = market.totalDepositBalanceUSD;
  marketHourlyMetrics.cumulativeDepositUSD = market.cumulativeDepositUSD;
  marketHourlyMetrics.totalBorrowBalanceUSD = market.totalBorrowBalanceUSD;
  marketHourlyMetrics.cumulativeBorrowUSD = market.cumulativeBorrowUSD;
  marketHourlyMetrics.cumulativeLiquidateUSD = market.cumulativeLiquidateUSD;
  marketHourlyMetrics.inputTokenBalance = market.inputTokenBalance;
  marketHourlyMetrics.inputTokenPriceUSD = market.inputTokenPriceUSD;
  marketHourlyMetrics.outputTokenSupply = market.outputTokenSupply;
  marketHourlyMetrics.outputTokenPriceUSD = market.outputTokenPriceUSD;
  marketHourlyMetrics.exchangeRate = market.exchangeRate;
  marketHourlyMetrics.rewardTokenEmissionsAmount = market.rewardTokenEmissionsAmount;
  marketHourlyMetrics.rewardTokenEmissionsUSD = market.rewardTokenEmissionsUSD;
  //}

  // update to latest block/timestamp
  marketDailyMetrics.blockNumber = block.number;
  marketDailyMetrics.timestamp = block.timestamp;
  marketHourlyMetrics.blockNumber = block.number;
  marketHourlyMetrics.timestamp = block.timestamp;

  // add to daily amounts
  if (eventType != null) {
    if (eventType == TransactionType.DEPOSIT) {
      marketDailyMetrics.dailyDepositUSD = marketDailyMetrics.dailyDepositUSD.plus(amountUSD);
      marketHourlyMetrics.hourlyDepositUSD = marketHourlyMetrics.hourlyDepositUSD.plus(amountUSD);
    } else if (eventType == TransactionType.BORROW) {
      marketDailyMetrics.dailyBorrowUSD = marketDailyMetrics.dailyBorrowUSD.plus(amountUSD);
      marketHourlyMetrics.hourlyBorrowUSD = marketHourlyMetrics.hourlyBorrowUSD.plus(amountUSD);
    } else if (eventType == TransactionType.REPAY) {
      marketDailyMetrics.dailyRepayUSD = marketDailyMetrics.dailyRepayUSD.plus(amountUSD);
      marketHourlyMetrics.hourlyRepayUSD = marketHourlyMetrics.hourlyRepayUSD.plus(amountUSD);
    } else if (eventType == TransactionType.WITHDRAW) {
      marketDailyMetrics.dailyWithdrawUSD = marketDailyMetrics.dailyWithdrawUSD.plus(amountUSD);
      marketHourlyMetrics.hourlyWithdrawUSD = marketHourlyMetrics.hourlyWithdrawUSD.plus(amountUSD);
    } else if (eventType == TransactionType.LIQUIDATE) {
      marketDailyMetrics.dailyLiquidateUSD = marketDailyMetrics.dailyLiquidateUSD.plus(amountUSD);
      marketHourlyMetrics.hourlyLiquidateUSD = marketHourlyMetrics.hourlyLiquidateUSD.plus(amountUSD);
    }
  }

  marketDailyMetrics.save();
  marketHourlyMetrics.save();
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
