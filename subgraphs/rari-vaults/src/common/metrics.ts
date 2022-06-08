// // update snapshots and metrics
import { Address, ethereum } from "@graphprotocol/graph-ts";
import {
  Account,
  ActiveAccount,
  UsageMetricsDailySnapshot,
  UsageMetricsHourlySnapshot,
  Vault,
} from "../../generated/schema";
import {
  getOrCreateFinancials,
  getOrCreateUsageDailySnapshot,
  getOrCreateUsageHourlySnapshot,
  getOrCreateVaultDailySnapshot,
  getOrCreateVaultHourlySnapshot,
  getOrCreateYieldAggregator,
} from "./getters";
import {
  SECONDS_PER_DAY,
  SECONDS_PER_HOUR,
  TransactionType,
} from "./utils/constants";

///////////////////////////
//// Snapshot Entities ////
///////////////////////////

// updates a given FinancialDailySnapshot Entity
export function updateFinancials(event: ethereum.Event): void {
  // number of days since unix epoch
  let financialMetrics = getOrCreateFinancials(event);
  let protocol = getOrCreateYieldAggregator();

  financialMetrics.totalValueLockedUSD = protocol.totalValueLockedUSD;
  financialMetrics.cumulativeSupplySideRevenueUSD =
    protocol.cumulativeSupplySideRevenueUSD;
  financialMetrics.cumulativeProtocolSideRevenueUSD =
    protocol.cumulativeProtocolSideRevenueUSD;
  financialMetrics.cumulativeTotalRevenueUSD =
    protocol.cumulativeTotalRevenueUSD;

  // update the block number and timestamp
  financialMetrics.blockNumber = event.block.number;
  financialMetrics.timestamp = event.block.timestamp;

  financialMetrics.save();
}

// update a given UsageMetricDailySnapshot
export function updateUsageMetrics(
  event: ethereum.Event,
  from: Address,
  transaction: string
): void {
  // Number of days since Unix epoch
  let id: i64 = event.block.timestamp.toI64() / SECONDS_PER_DAY;
  let hour: i64 =
    (event.block.timestamp.toI64() - id * SECONDS_PER_DAY) / SECONDS_PER_HOUR;
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
  let protocol = getOrCreateYieldAggregator();
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

// update vault daily metrics
export function updateVaultDailyMetrics(
  event: ethereum.Event,
  vaultId: string
): void {
  let vaultMetrics = getOrCreateVaultDailySnapshot(event, vaultId);
  let vault = Vault.load(vaultId);

  vaultMetrics.totalValueLockedUSD = vault!.totalValueLockedUSD;
  vaultMetrics.inputTokenBalance = vault!.inputTokenBalance;
  vaultMetrics.outputTokenSupply = vault!.outputTokenSupply!;
  vaultMetrics.outputTokenPriceUSD = vault!.outputTokenPriceUSD;
  vaultMetrics.pricePerShare = vault!.pricePerShare;

  // update block and timestamp
  vaultMetrics.blockNumber = event.block.number;
  vaultMetrics.timestamp = event.block.timestamp;

  vaultMetrics.save();
}

// update vault hourly metrics
export function updateVaultHourlyMetrics(
  event: ethereum.Event,
  vaultId: string
): void {
  let vaultMetrics = getOrCreateVaultHourlySnapshot(event, vaultId);
  let vault = Vault.load(vaultId);

  vaultMetrics.totalValueLockedUSD = vault!.totalValueLockedUSD;
  vaultMetrics.inputTokenBalance = vault!.inputTokenBalance;
  vaultMetrics.outputTokenSupply = vault!.outputTokenSupply!;
  vaultMetrics.outputTokenPriceUSD = vault!.outputTokenPriceUSD;
  vaultMetrics.pricePerShare = vault!.pricePerShare;

  // update block and timestamp
  vaultMetrics.blockNumber = event.block.number;
  vaultMetrics.timestamp = event.block.timestamp;

  vaultMetrics.save();
}

/////////////////
//// Helpers ////
/////////////////

function updateTransactionCount(
  dailyUsage: UsageMetricsDailySnapshot,
  hourlyUsage: UsageMetricsHourlySnapshot,
  transaction: string
): void {
  if (transaction == TransactionType.DEPOSIT) {
    hourlyUsage.hourlyDepositCount += 1;
    dailyUsage.dailyDepositCount += 1;
  } else if (transaction == TransactionType.WITHDRAW) {
    hourlyUsage.hourlyWithdrawCount += 1;
    dailyUsage.dailyWithdrawCount += 1;
  }

  hourlyUsage.save();
  dailyUsage.save();
}
