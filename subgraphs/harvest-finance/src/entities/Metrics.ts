import { BigInt, ethereum } from "@graphprotocol/graph-ts";
import { Vault, UsageMetricsDailySnapshot, UsageMetricsHourlySnapshot, ActiveAccount } from "../../generated/schema";
import { BIGINT_ZERO } from "../constant";
import { getDay } from "../utils/numbers";
import { getOrCreateProtocol } from "./Protocol";
import {
  Deposit as DepositEvent,
  Withdraw as WithdrawEvent
} from "../../generated/ControllerListener/VaultContract"
import { SECONDS_PER_DAY, SECONDS_PER_HOUR } from "../constant";


export function depositUpdateMetrics(event: ethereum.Event, vault: Vault): void {
  updateUsageMetricsSnapshotsAfterDeposit(event);
}

function updateUsageMetricsSnapshotsAfterDeposit(event: ethereum.Event): void {
  let day: i64 = event.block.timestamp.toI64() / SECONDS_PER_DAY;
  updateUsageMetricsSnapshotsAfterDeposit_daily(day, event);
  updateUsageMetricsSnapshotsAfterDeposit_hourly(day, event);
}

function updateUsageMetricsSnapshots_daily(day: i64, event: ethereum.Event): UsageMetricsDailySnapshot {
  // DAILY SNAPSHOT
  let account_id = "daily-"
  .concat(event.transaction.from.toHexString())
  .concat("-")
  .concat(day.toString());

  let snapshot = getOrCreateUsageMetricsDailySnapshot(day.toString());

  snapshot.dailyTransactionCount += 1;
  snapshot.timestamp = event.block.timestamp;

  let account = ActiveAccount.load(account_id);

  if(!account)
    // The account didn't already interact with the protol this day

    // we create an activeAccount object for the account to not recount the same account twice
    account = new ActiveAccount(account_id);
    account.save();

    snapshot.dailyActiveUsers += 1;

  snapshot.save();

  return snapshot;
}

function updateUsageMetricsSnapshotsAfterDeposit_daily(day: i64, event: ethereum.Event): void {
  let snapshot = updateUsageMetricsSnapshots_daily(day, event);

  snapshot.dailyDepositCount += 1;
  snapshot.save();
}

function updateUsageMetricsSnapshotsAfterWithdraw_daily(day: i64, event: ethereum.Event): void {
  let snapshot = updateUsageMetricsSnapshots_daily(day, event);

  snapshot.dailyWithdrawCount += 1;
  snapshot.save();
}

function updateUsageMetricsSnapshots_hourly(day: i64, event: ethereum.Event): UsageMetricsHourlySnapshot {
  // hourly SNAPSHOT

  let hour = event.block.timestamp.toI64() / SECONDS_PER_HOUR;

  let account_id = "hourly-"
  .concat(event.transaction.from.toHexString())
  .concat("-")
  .concat(day.toString())
  .concat(hour.toString()); 

  let snapshot = getOrCreateUsageMetricsHourlySnapshot(day.toString().concat('-').concat(hour.toString()));

  snapshot.hourlyTransactionCount += 1;
  
  snapshot.timestamp = event.block.timestamp;

  let account = ActiveAccount.load(account_id);

  if(!account)
    // The account didn't already interact with the protol this day

    // we create an activeAccount object for the account to not recount the same account twice
    account = new ActiveAccount(account_id);
    account.save();

    snapshot.hourlyActiveUsers += 1;

  snapshot.save();

  return snapshot;
}

function updateUsageMetricsSnapshotsAfterDeposit_hourly(day: i64, event: ethereum.Event): void {
  let snapshot = updateUsageMetricsSnapshots_hourly(day, event);
  snapshot.hourlyDepositCount += 1;
  snapshot.save();
}

function updateUsageMetricsSnapshotsAfterWithdraw_hourly(day: i64, event: ethereum.Event): void {
  let snapshot = updateUsageMetricsSnapshots_hourly(day, event);
  snapshot.hourlyWithdrawCount += 1;
  snapshot.save();
}

function getOrCreateUsageMetricsDailySnapshot(id: String): UsageMetricsDailySnapshot {

  let snapshot = UsageMetricsDailySnapshot.load(id);

  if(snapshot){
    return snapshot as UsageMetricsDailySnapshot;
  }

  snapshot = new UsageMetricsDailySnapshot(id);

  snapshot.protocol = getOrCreateProtocol().id;
  snapshot.dailyActiveUsers = 0;
  snapshot.cumulativeUniqueUsers = 0;
  snapshot.dailyTransactionCount = 0;
  snapshot.dailyDepositCount = 0;
  snapshot.dailyWithdrawCount = 0;
  snapshot.blockNumber = BIGINT_ZERO;
  snapshot.timestamp = BIGINT_ZERO;

  snapshot.save();

  return snapshot as UsageMetricsDailySnapshot;

}

function getOrCreateUsageMetricsHourlySnapshot(id: String): UsageMetricsHourlySnapshot {

  let snapshot = UsageMetricsHourlySnapshot.load(id);

  if(snapshot){
    return snapshot as UsageMetricsHourlySnapshot;
  }

  snapshot = new UsageMetricsHourlySnapshot(id);

  snapshot.protocol = getOrCreateProtocol().id;
  snapshot.hourlyActiveUsers = 0;
  snapshot.cumulativeUniqueUsers = 0;
  snapshot.hourlyTransactionCount = 0;
  snapshot.hourlyDepositCount = 0;
  snapshot.hourlyWithdrawCount = 0;
  snapshot.blockNumber = BIGINT_ZERO;
  snapshot.timestamp = BIGINT_ZERO;

  snapshot.save();

  return snapshot as UsageMetricsHourlySnapshot;

}

export function withdrawUpdateMetrics(event: ethereum.Event, vault: Vault): void {
  updateUsageMetricsSnapshotsAfterWithdraw(event);
}

function updateUsageMetricsSnapshotsAfterWithdraw(event: ethereum.Event): void {
  let day: i64 = event.block.timestamp.toI64() / SECONDS_PER_DAY;
  updateUsageMetricsSnapshotsAfterWithdraw_daily(day, event);
  updateUsageMetricsSnapshotsAfterWithdraw_hourly(day, event);
}
