import * as constants from "./constants";
import { BigInt, Address } from "@graphprotocol/graph-ts";
import { UsageMetricsDailySnapshot, _Account, _DailyActiveAccount } from "../../generated/schema";


export function updateUsageMetrics(
  blockNumber: BigInt,
  timestamp: BigInt,
  from: Address
): void {
  // Number of days since Unix epoch
  let id: i64 = timestamp.toI64() / constants.SECONDS_PER_DAY;
  let usageMetrics = UsageMetricsDailySnapshot.load(id.toString());

  if (!usageMetrics) {
    usageMetrics = new UsageMetricsDailySnapshot(id.toString());
    usageMetrics.protocol = constants.ETHEREUM_PROTOCOL_ID;

    usageMetrics.activeUsers = 0;
    usageMetrics.totalUniqueUsers = 0;
    usageMetrics.dailyTransactionCount = 0;
  }

  // Update the block number and timestamp to that of the last transaction of that day
  usageMetrics.blockNumber = blockNumber;
  usageMetrics.timestamp = timestamp;
  usageMetrics.dailyTransactionCount += 1;

  let accountId = from.toHexString();
  let account = _Account.load(accountId);
  if (!account) {
    account = new _Account(accountId);
    account.save();
    usageMetrics.totalUniqueUsers += 1;
  }

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
