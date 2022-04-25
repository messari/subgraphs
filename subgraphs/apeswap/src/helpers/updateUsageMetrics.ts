import { Address, BigInt } from "@graphprotocol/graph-ts";
import {
  _Account,
  _DailyActiveAccount,
  DexAmmProtocol,
  UsageMetricsDailySnapshot,
} from "../../generated/schema";
import { INT_ONE, INT_ZERO, SECONDS_PER_DAY } from "../utils/constant";

export function updateUsageMetrics(
  provider: Address,
  protocol: DexAmmProtocol,
  timestamp: BigInt,
  blockNumber: BigInt,
): void {
  // Number of days since Unix epoch
  let id: i64 = timestamp.toI64() / SECONDS_PER_DAY;
  let usageMetrics = UsageMetricsDailySnapshot.load(id.toString());
  if (usageMetrics == null) {
    usageMetrics = new UsageMetricsDailySnapshot(id.toString());
    usageMetrics.protocol = protocol.id;
    usageMetrics.activeUsers = INT_ZERO;
    usageMetrics.totalUniqueUsers = INT_ZERO;
    usageMetrics.dailyTransactionCount = INT_ZERO;
    usageMetrics.blockNumber = blockNumber;
    usageMetrics.timestamp = timestamp;
    usageMetrics.save();
  }

  // Update the block number and timestamp to that of the last transaction of that day
  usageMetrics.blockNumber = blockNumber;
  usageMetrics.timestamp = timestamp;
  usageMetrics.dailyTransactionCount += INT_ONE;
  let accountId = provider.toHexString();
  let account = _Account.load(accountId);
  if (!account) {
    account = new _Account(accountId);
    account.save();
    usageMetrics.totalUniqueUsers += INT_ONE;
    protocol.totalUniqueUsers += INT_ONE;
    protocol.save();
  }
  // Combine the id and the user address to generate a unique user id for the day
  let dailyActiveAccountId = id
    .toString()
    .concat("-")
    .concat(provider.toHexString());
  let dailyActiveAccount = _DailyActiveAccount.load(dailyActiveAccountId);
  if (!dailyActiveAccount) {
    dailyActiveAccount = new _DailyActiveAccount(dailyActiveAccountId);
    dailyActiveAccount.save();
    usageMetrics.activeUsers += INT_ONE;
  }
  usageMetrics.save();
}
