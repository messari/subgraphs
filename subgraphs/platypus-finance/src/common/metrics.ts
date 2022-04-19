import { BigDecimal, Address, ethereum } from "@graphprotocol/graph-ts";
import { Account, ActiveAccount, UsageMetricsDailySnapshot } from "../../generated/schema";
import { PROTOCOL_ADMIN, SECONDS_PER_DAY } from "./constants";
import {
  getOrCreateDexAmm,
  getOrCreateLiquidityPoolDailySnapshot,
  getOrCreateLiquidityPoolHourlySnapshot,
  getOrCreateFinancialsDailySnapshot,
  getOrCreateDailyUsageMetricSnapshot,
  getOrCreateHourlyUsageMetricSnapshot,
} from "./getters";
import { getHours } from "./utils/datetime";

// Update FinancialsDailySnapshots entity
export function updateFinancials(event: ethereum.Event): void {
  let protocol = getOrCreateDexAmm();
  let financialMetrics = getOrCreateFinancialsDailySnapshot(event);
  // // Update the block number and timestamp to that of the last transaction of that day
  financialMetrics.blockNumber = event.block.number;
  financialMetrics.timestamp = event.block.timestamp;
  financialMetrics.totalValueLockedUSD = protocol.totalValueLockedUSD;
  // ...
  financialMetrics.save();
}

export function updateUsageMetrics(event: ethereum.Event, from: Address): void {
  // Number of days since Unix epoch
  let id: i64 = event.block.timestamp.toI64() / SECONDS_PER_DAY;

  let dailyUsageMetrics = getOrCreateDailyUsageMetricSnapshot(event);
  let hourlyUsageMetrics = getOrCreateHourlyUsageMetricSnapshot(event);

  // Update the block number and timestamp to that of the last transaction of that day
  dailyUsageMetrics.blockNumber = event.block.number;
  dailyUsageMetrics.timestamp = event.block.timestamp;
  dailyUsageMetrics.dailyTransactionCount += 1;

  // Update the block number and timestamp to that of the last transaction of that hour
  hourlyUsageMetrics.blockNumber = event.block.number;
  hourlyUsageMetrics.timestamp = event.block.timestamp;
  hourlyUsageMetrics.hourlyTransactionCount += 1;

  let accountId = from.toHexString();

  // Protocol Level Account
  let account = Account.load(accountId);
  let protocol = getOrCreateDexAmm();
  if (!account) {
    account = new Account(accountId);
    account.save();

    protocol.cumulativeUniqueUsers += 1;
    protocol.save();
  }

  dailyUsageMetrics.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers;
  hourlyUsageMetrics.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers;

  // Day Level Active Account
  // Combine the id and the user address to generate a unique user id for the day
  let dailyActiveAccountId = from.toHexString() + "-" + id.toString();
  let dailyActiveAccount = ActiveAccount.load(dailyActiveAccountId);
  if (!dailyActiveAccount) {
    dailyActiveAccount = new ActiveAccount(dailyActiveAccountId);
    dailyActiveAccount.save();
    dailyUsageMetrics.dailyActiveUsers += 1;
  }

  // Hour Level Active Account
  let hour: i64 = getHours(event.block.timestamp.toI64());
  // Combine the id and hour of day and the user address to generate a unique user id for the hour
  let hourlyActiveAccountId = from.toHexString() + "-" + id.toString() + "-" + hour.toString();
  let hourlyActiveAccount = ActiveAccount.load(hourlyActiveAccountId);
  if (!hourlyActiveAccount) {
    hourlyActiveAccount = new ActiveAccount(hourlyActiveAccountId);
    hourlyActiveAccount.save();
    hourlyUsageMetrics.hourlyActiveUsers += 1;
  }

  dailyUsageMetrics.save();
  hourlyUsageMetrics.save();
}

// Update UsagePoolDailySnapshot entity
export function updatePoolMetrics(event: ethereum.Event): void {
  // Number of days since Unix epoch
  let id: i64 = event.block.timestamp.toI64() / SECONDS_PER_DAY;

  let poolDailySnapshot = getOrCreateLiquidityPoolDailySnapshot(event);
  let poolHourlySnapshot = getOrCreateLiquidityPoolHourlySnapshot(event);

  // Update the block number and timestamp to that of the last transaction of that day
  poolDailySnapshot.blockNumber = event.block.number;
  poolDailySnapshot.timestamp = event.block.timestamp;

  // Update the block number and timestamp to that of the last transaction of that hour
  poolHourlySnapshot.blockNumber = event.block.number;
  poolHourlySnapshot.timestamp = event.block.timestamp;

  poolDailySnapshot.save();
  poolHourlySnapshot.save();
}
