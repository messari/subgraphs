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
    if (protocol._depositors.indexOf(account.id) < 0) {
      protocol._depositors = addToArrayAtIndex(
        protocol._depositors,
        account.id,
        0
      );
      dailySnapshot.cumulativeUniqueDepositors = protocol._depositors.length;
      protocol.cumulativeUniqueDepositors = protocol._depositors.length;
    }
    if (!activeEvent) {
      activeEvent = new ActiveEventAccount(activeEventId);
      dailySnapshot.dailyActiveDepositors += 1;
    }
  } else if (transactionType == TransactionType.BORROW) {
    if (protocol._borrowers.indexOf(account.id) < 0) {
      protocol._borrowers = addToArrayAtIndex(
        protocol._borrowers,
        account.id,
        0
      );
      dailySnapshot.cumulativeUniqueBorrowers = protocol._borrowers.length;
      protocol.cumulativeUniqueBorrowers = protocol._borrowers.length;
    }
    if (!activeEvent) {
      activeEvent = new ActiveEventAccount(activeEventId);
      dailySnapshot.dailyActiveBorrowers += 1;
    }
  } else if (transactionType == TransactionType.LIQUIDATOR) {
    if (protocol._liquidators.indexOf(account.id) < 0) {
      protocol._liquidators = addToArrayAtIndex(
        protocol._liquidators,
        account.id,
        0
      );
      dailySnapshot.cumulativeUniqueLiquidators = protocol._liquidators.length;
      protocol.cumulativeUniqueLiquidators = protocol._liquidators.length;
    }
    if (!activeEvent) {
      activeEvent = new ActiveEventAccount(activeEventId);
      dailySnapshot.dailyActiveLiquidators += 1;
    }
    account.liquidateCount += 1;
  } else if (transactionType == TransactionType.LIQUIDATEE) {
    if (protocol._liquidatees.indexOf(account.id) < 0) {
      protocol._liquidatees = addToArrayAtIndex(
        protocol._liquidatees,
        account.id,
        0
      );
      dailySnapshot.cumulativeUniqueLiquidatees = protocol._liquidatees.length;
      protocol.cumulativeUniqueLiquidatees = protocol._liquidatees.length;
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
