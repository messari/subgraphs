import { Address, dataSource, ethereum } from "@graphprotocol/graph-ts";
import { Account, ActiveAccount } from "../../../generated/schema";
import { REGISTRY_ADDRESS_MAP, UsageType } from "../../common/constants";
import {
  getOrCreateUsageMetricDailySnapshot,
  getOrCreateUsageMetricHourlySnapshot,
  getOrCreateYieldAggregator,
} from "../../common/getters";
import {
  getDaysSinceEpoch,
  getHoursSinceEpoch,
} from "../../common/utils/datetime";

//  Update usage related fields and entities
export function updateUsageMetrics(
  accountAddress: Address,
  eventType: string,
  event: ethereum.Event
): void {
  const timestamp = event.block.timestamp.toI32();

  // Add account
  let isNewAccount = createAccount(accountAddress, timestamp);

  // Add active accounts
  let isNewDailyAccount = createDailyActiveAccount(accountAddress, timestamp);
  let isNewHourlyAccount = createHourlyActiveAccount(accountAddress, timestamp);

  // Update entities
  let protocol = getOrCreateYieldAggregator(
    REGISTRY_ADDRESS_MAP.get(dataSource.network())!
  );
  let dailyUsageSnapshot = getOrCreateUsageMetricDailySnapshot(event);
  let hourlyUsageSnapshot = getOrCreateUsageMetricHourlySnapshot(event);

  let cumulativeUniqueUsers = protocol.cumulativeUniqueUsers;
  if (isNewAccount) {
    cumulativeUniqueUsers += 1;
  }

  if (isNewDailyAccount) {
    dailyUsageSnapshot.dailyActiveUsers += 1;
  }

  if (isNewHourlyAccount) {
    hourlyUsageSnapshot.hourlyActiveUsers += 1;
  }

  if (eventType === UsageType.DEPOSIT) {
    dailyUsageSnapshot.dailyDepositCount += 1;
    hourlyUsageSnapshot.hourlyDepositCount += 1;
  }

  if (eventType === UsageType.WITHDRAW) {
    dailyUsageSnapshot.dailyWithdrawCount += 1;
    hourlyUsageSnapshot.hourlyWithdrawCount += 1;
  }

  protocol.cumulativeUniqueUsers = cumulativeUniqueUsers;

  dailyUsageSnapshot.blockNumber = event.block.number;
  dailyUsageSnapshot.timestamp = event.block.timestamp;
  dailyUsageSnapshot.dailyTransactionCount += 1;
  dailyUsageSnapshot.cumulativeUniqueUsers = cumulativeUniqueUsers;
  dailyUsageSnapshot.totalPoolCount = protocol.totalPoolCount;

  hourlyUsageSnapshot.blockNumber = event.block.number;
  hourlyUsageSnapshot.timestamp = event.block.timestamp;
  hourlyUsageSnapshot.hourlyTransactionCount += 1;
  hourlyUsageSnapshot.cumulativeUniqueUsers = cumulativeUniqueUsers;

  protocol.save();
  dailyUsageSnapshot.save();
  hourlyUsageSnapshot.save();
}

export function createAccount(
  accountAddress: Address,
  timestamp: i32
): boolean {
  let isNewAccount = false;
  let accountId = accountAddress.toHex();

  let account = Account.load(accountId);
  if (!account) {
    isNewAccount = true;
    account = new Account(accountId);
    account.save();
  }

  return isNewAccount;
}

export function _createActiveAccount(accountId: string): boolean {
  let isNewAccount = false;

  let account = ActiveAccount.load(accountId);
  if (!account) {
    isNewAccount = true;
    account = new ActiveAccount(accountId);
    account.save();
  }
  return isNewAccount;
}

export function createDailyActiveAccount(
  accountAddress: Address,
  timestamp: i32
): boolean {
  const dailyAccountId = "daily"
    .concat("-")
    .concat(accountAddress.toHex())
    .concat("-")
    .concat(getDaysSinceEpoch(timestamp));

  return _createActiveAccount(dailyAccountId);
}

export function createHourlyActiveAccount(
  accountAddress: Address,
  timestamp: i32
): boolean {
  const hourlyAccountId = "hourly"
    .concat("-")
    .concat(accountAddress.toHex())
    .concat("-")
    .concat(getHoursSinceEpoch(timestamp));

  return _createActiveAccount(hourlyAccountId);
}
