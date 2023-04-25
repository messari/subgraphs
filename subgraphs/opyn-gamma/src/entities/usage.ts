import { Bytes, ethereum } from "@graphprotocol/graph-ts";
import {
  Account,
  ActiveAccount,
  _ActivityHelper,
} from "../../generated/schema";
import {
  ActivityHelperID,
  INT_ZERO,
  SECONDS_PER_DAY,
  SECONDS_PER_HOUR,
} from "../common/constants";
import {
  incrementProtocolUniqueLPs,
  incrementProtocolUniqueTakers,
} from "./protocol";

export function updateActiveAccounts(
  event: ethereum.Event,
  account: Account
): void {
  const activityHelper = getOrCreateActivityHelper();
  const timestamp = event.block.timestamp.toI64();
  const days = `${timestamp / SECONDS_PER_DAY}`;
  const hours = `${timestamp / SECONDS_PER_HOUR}`;
  // Combine the id and the user address to generate a unique user id for the day
  const dailyActiveAccountId = Bytes.fromUTF8(
    `daily-${account.id.toHex()}-${days}`
  );
  let dailyActiveAccount = ActiveAccount.load(dailyActiveAccountId);
  if (!dailyActiveAccount) {
    dailyActiveAccount = new ActiveAccount(dailyActiveAccountId);
    dailyActiveAccount.save();
    activityHelper.dailyActiveUsers += 1;
    activityHelper.save();
  }
  // Combine the id, user address and hour to generate a unique user id for the hour
  const hourlyActiveAccountId = Bytes.fromUTF8(
    `hourly-${account.id.toHex()}-${hours}`
  );
  let hourlyActiveAccount = ActiveAccount.load(hourlyActiveAccountId);
  if (!hourlyActiveAccount) {
    hourlyActiveAccount = new ActiveAccount(hourlyActiveAccountId);
    hourlyActiveAccount.save();
    activityHelper.hourlyActiveUsers += 1;
    activityHelper.save();
  }
}

function isUniqueUser(account: Account, action: string): boolean {
  const id = Bytes.fromUTF8(`${account.id.toHex()}-${action}`);
  let activeAccount = ActiveAccount.load(id);
  if (!activeAccount) {
    activeAccount = new ActiveAccount(id);
    activeAccount.save();
    return true;
  }
  return false;
}

function isUniqueDailyUser(
  event: ethereum.Event,
  account: Account,
  action: string
): boolean {
  const timestamp = event.block.timestamp.toI64();
  const day = `${timestamp / SECONDS_PER_DAY}`;
  // Combine the id, user address, and action to generate a unique user id for the day
  const dailyActionActiveAccountId = Bytes.fromUTF8(
    `daily-${account.id.toHex()}-${action}-${day}`
  );
  let dailyActionActiveAccount = ActiveAccount.load(dailyActionActiveAccountId);
  if (!dailyActionActiveAccount) {
    dailyActionActiveAccount = new ActiveAccount(dailyActionActiveAccountId);
    dailyActionActiveAccount.save();
    return true;
  }
  return false;
}

export function incrementProtocolDepositCount(
  event: ethereum.Event,
  account: Account
): void {
  updateActiveAccounts(event, account);
  if (isUniqueUser(account, "lp")) {
    incrementProtocolUniqueLPs();
  }
  const activityHelper = getOrCreateActivityHelper();
  activityHelper.dailyDepositCount += 1;
  activityHelper.dailyTransactionCount += 1;
  activityHelper.hourlyDepositCount += 1;
  activityHelper.hourlyTransactionCount += 1;
  if (isUniqueDailyUser(event, account, "lp")) {
    activityHelper.dailyUniqueLP += 1;
  }
  activityHelper.save();
}

export function incrementProtocolWithdrawCount(
  event: ethereum.Event,
  account: Account
): void {
  updateActiveAccounts(event, account);
  if (isUniqueUser(account, "lp")) {
    incrementProtocolUniqueLPs();
  }
  const activityHelper = getOrCreateActivityHelper();
  activityHelper.dailyWithdrawCount += 1;
  activityHelper.dailyTransactionCount += 1;
  activityHelper.hourlyWithdrawCount += 1;
  activityHelper.hourlyTransactionCount += 1;
  if (isUniqueDailyUser(event, account, "lp")) {
    activityHelper.dailyUniqueLP += 1;
  }
  activityHelper.save();
}
export function incrementProtocolTakerCount(
  event: ethereum.Event,
  account: Account
): void {
  updateActiveAccounts(event, account);
  if (isUniqueUser(account, "taker")) {
    incrementProtocolUniqueTakers();
  }
  const activityHelper = getOrCreateActivityHelper();
  if (isUniqueDailyUser(event, account, "taker")) {
    activityHelper.dailyUniqueTakers += 1;
    activityHelper.save();
  }
}

export function getOrCreateActivityHelper(): _ActivityHelper {
  let activityHelper = _ActivityHelper.load(ActivityHelperID);
  if (!activityHelper) {
    activityHelper = new _ActivityHelper(ActivityHelperID);
    activityHelper.hourlyActiveUsers = INT_ZERO;
    activityHelper.dailyActiveUsers = INT_ZERO;
    activityHelper.hourlyUniqueLP = INT_ZERO;
    activityHelper.dailyUniqueLP = INT_ZERO;
    activityHelper.hourlyUniqueTakers = INT_ZERO;
    activityHelper.dailyUniqueTakers = INT_ZERO;
    activityHelper.hourlyTransactionCount = INT_ZERO;
    activityHelper.dailyTransactionCount = INT_ZERO;
    activityHelper.hourlyDepositCount = INT_ZERO;
    activityHelper.dailyDepositCount = INT_ZERO;
    activityHelper.hourlyWithdrawCount = INT_ZERO;
    activityHelper.dailyWithdrawCount = INT_ZERO;
    activityHelper.save();
  }
  return activityHelper;
}
