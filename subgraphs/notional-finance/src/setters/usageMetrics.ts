import { Address, ethereum } from "@graphprotocol/graph-ts";
import { getOrCreateLendingProtocol } from "../getters/protocol";
import {
  Account,
  ActiveAccount,
  ActiveEventAccount,
} from "../../generated/schema";
import {
  SECONDS_PER_DAY,
  SECONDS_PER_HOUR,
  TransactionType,
} from "../common/constants";
import {
  getOrCreateUsageMetricsDailySnapshot,
  getOrCreateUsageMetricsHourlySnapshot,
} from "../getters/usageMetrics";
import { addToArrayAtIndex } from "../common/arrays";

export function updateUsageMetrics(
  event: ethereum.Event,
  from: Address,
  to: Address,
  transactionType: string
): void {
  const hourlyId: i64 = event.block.timestamp.toI64() / SECONDS_PER_HOUR;
  const dailyId: i64 = event.block.timestamp.toI64() / SECONDS_PER_DAY;
  const usageHourlySnapshot = getOrCreateUsageMetricsHourlySnapshot(event);
  const usageDailySnapshot = getOrCreateUsageMetricsDailySnapshot(event);
  const protocol = getOrCreateLendingProtocol();

  // Update the block number and timestamp to that of the last transaction of that day
  usageHourlySnapshot.blockNumber = event.block.number;
  usageHourlySnapshot.timestamp = event.block.timestamp;
  usageHourlySnapshot.hourlyTransactionCount += 1;

  usageDailySnapshot.blockNumber = event.block.number;
  usageDailySnapshot.timestamp = event.block.timestamp;
  usageDailySnapshot.dailyTransactionCount += 1;

  usageHourlySnapshot.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers;
  usageDailySnapshot.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers;

  // Combine the id and the user address to generate a unique user id for the hour/day
  const hourlyActiveAccountIdFrom =
    "hourly-" + from.toHexString() + "-" + hourlyId.toString();
  let hourlyActiveAccountFrom = ActiveAccount.load(hourlyActiveAccountIdFrom);
  if (!hourlyActiveAccountFrom) {
    hourlyActiveAccountFrom = new ActiveAccount(hourlyActiveAccountIdFrom);
    hourlyActiveAccountFrom.save();
    usageHourlySnapshot.hourlyActiveUsers += 1;
  }

  const hourlyActiveAccountIdTo =
    "hourly-" + to.toHexString() + "-" + hourlyId.toString();
  let hourlyActiveAccountTo = ActiveAccount.load(hourlyActiveAccountIdTo);
  if (!hourlyActiveAccountTo) {
    hourlyActiveAccountTo = new ActiveAccount(hourlyActiveAccountIdTo);
    hourlyActiveAccountTo.save();
    usageHourlySnapshot.hourlyActiveUsers += 1;
  }

  const dailyActiveAccountIdFrom =
    "daily-" + from.toHexString() + "-" + dailyId.toString();
  let dailyActiveAccountFrom = ActiveAccount.load(dailyActiveAccountIdFrom);
  if (!dailyActiveAccountFrom) {
    dailyActiveAccountFrom = new ActiveAccount(dailyActiveAccountIdFrom);
    dailyActiveAccountFrom.save();
    usageDailySnapshot.dailyActiveUsers += 1;
  }

  const dailyActiveAccountIdTo =
    "daily-" + to.toHexString() + "-" + dailyId.toString();
  let dailyActiveAccountTo = ActiveAccount.load(dailyActiveAccountIdTo);
  if (!dailyActiveAccountTo) {
    dailyActiveAccountTo = new ActiveAccount(dailyActiveAccountIdTo);
    dailyActiveAccountTo.save();
    usageDailySnapshot.dailyActiveUsers += 1;
  }

  if (transactionType == TransactionType.DEPOSIT) {
    usageHourlySnapshot.hourlyDepositCount += 1;
    usageDailySnapshot.dailyDepositCount += 1;
  } else if (transactionType == TransactionType.WITHDRAW) {
    usageHourlySnapshot.hourlyWithdrawCount += 1;
    usageDailySnapshot.dailyWithdrawCount += 1;
  } else if (transactionType == TransactionType.BORROW) {
    usageHourlySnapshot.hourlyBorrowCount += 1;
    usageDailySnapshot.dailyBorrowCount += 1;
  } else if (transactionType == TransactionType.REPAY) {
    usageHourlySnapshot.hourlyRepayCount += 1;
    usageDailySnapshot.dailyRepayCount += 1;
  } else if (transactionType == TransactionType.LIQUIDATEE) {
    usageHourlySnapshot.hourlyLiquidateCount += 1;
    usageDailySnapshot.dailyLiquidateCount += 1;
  }

  usageDailySnapshot.totalPoolCount = protocol.totalPoolCount;

  usageHourlySnapshot.save();
  usageDailySnapshot.save();
}

export function addAccountToProtocol(
  transactionType: string,
  account: Account,
  event: ethereum.Event
): void {
  const protocol = getOrCreateLendingProtocol();
  const dailyId: string = (
    event.block.timestamp.toI64() / SECONDS_PER_DAY
  ).toString();
  const activeEventId = `daily-${account.id}-${dailyId}-${transactionType}`;
  let activeEvent = ActiveEventAccount.load(activeEventId);
  const dailySnapshot = getOrCreateUsageMetricsDailySnapshot(event);
  if (transactionType == TransactionType.DEPOSIT) {
    if (protocol.depositors.indexOf(account.id) < 0) {
      protocol.depositors = addToArrayAtIndex(
        protocol.depositors,
        account.id,
        0
      );
      dailySnapshot.cumulativeUniqueDepositors = protocol.depositors.length;
      protocol.cumulativeUniqueDepositors = protocol.depositors.length;
    }
    if (!activeEvent) {
      activeEvent = new ActiveEventAccount(activeEventId);
      dailySnapshot.dailyActiveDepositors += 1;
    }
  } else if (transactionType == TransactionType.BORROW) {
    if (protocol.borrowers.indexOf(account.id) < 0) {
      protocol.borrowers = addToArrayAtIndex(protocol.borrowers, account.id, 0);
      dailySnapshot.cumulativeUniqueBorrowers = protocol.borrowers.length;
      protocol.cumulativeUniqueBorrowers = protocol.borrowers.length;
    }
    if (!activeEvent) {
      activeEvent = new ActiveEventAccount(activeEventId);
      dailySnapshot.dailyActiveBorrowers += 1;
    }
  } else if (transactionType == TransactionType.LIQUIDATOR) {
    if (protocol.liquidators.indexOf(account.id) < 0) {
      protocol.liquidators = addToArrayAtIndex(
        protocol.liquidators,
        account.id,
        0
      );
      dailySnapshot.cumulativeUniqueLiquidators = protocol.liquidators.length;
      protocol.cumulativeUniqueLiquidators = protocol.liquidators.length;
    }
    if (!activeEvent) {
      activeEvent = new ActiveEventAccount(activeEventId);
      dailySnapshot.dailyActiveLiquidators += 1;
    }
    account.liquidateCount += 1;
  } else if (transactionType == TransactionType.LIQUIDATEE) {
    if (protocol.liquidatees.indexOf(account.id) < 0) {
      protocol.liquidatees = addToArrayAtIndex(
        protocol.liquidatees,
        account.id,
        0
      );
      dailySnapshot.cumulativeUniqueLiquidatees = protocol.liquidatees.length;
      protocol.cumulativeUniqueLiquidatees = protocol.liquidatees.length;
    }
    if (!activeEvent) {
      activeEvent = new ActiveEventAccount(activeEventId);
      dailySnapshot.dailyActiveLiquidatees += 1;
    }
    account.liquidationCount += 1;
  }

  activeEvent!.save();
  account.save();
  protocol.save();
  dailySnapshot.save();
}
