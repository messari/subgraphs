import { BigInt, ethereum } from "@graphprotocol/graph-ts";
import { Vault, UsageMetricsDailySnapshot, ActiveAccount } from "../../generated/schema";
import { BIGINT_ZERO } from "../constant";
import { getDay } from "../utils/numbers";
import { getOrCreateProtocol } from "./Protocol";
import {
  Deposit as DepositEvent,
  Withdraw as WithdrawEvent
} from "../../generated/ControllerListener/VaultContract"
import { SECONDS_PER_DAY } from "../constant";


export function depositUpdateMetrics(event: ethereum.Event, vault: Vault): void {
  updateUsageMetricsDailySnapshotAfterDeposit(event);
}

function updateUsageMetricsDailySnapshotAfterDeposit(event: ethereum.Event): void {
  let day: i64 = event.block.timestamp.toI64() / SECONDS_PER_DAY;

  let account_id = "daily-"
  .concat(event.transaction.from.toHexString())
  .concat("-")
  .concat(day.toString());

  let snapshot = getOrCreateUsageMetricsDailySnapshot(day.toString());

  snapshot.dailyTransactionCount += 1;
  snapshot.dailyDepositCount += 1;
  snapshot.timestamp = event.block.timestamp;

  let account = ActiveAccount.load(account_id);

  if(!account)
    // The account didn't already interact with the protol this day

    // we create an activeAccount object for the account to not recount the same account twice
    account = new ActiveAccount(account_id);
    account.save();

    snapshot.dailyActiveUsers += 1;

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

