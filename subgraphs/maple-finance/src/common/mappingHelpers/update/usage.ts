import { Address, ethereum, log } from "@graphprotocol/graph-ts";

import { Account, ActiveAccount, Market } from "../../../../generated/schema";

import { ONE_I32, TransactionType } from "../../constants";
import { getOrCreateUsageDailyMetric, getOrCreateUsageHourlyMetric } from "../getOrCreate/snapshots";
import { getOrCreateProtocol } from "../getOrCreate/protocol";

/**
 * Update usage metrics, this should be called on every transaction.
 * @param event event from the transaction
 * @param accountAddress account using the protocol
 * @param transactionType type of transaction, this should be a TransactionType
 */
export function updateUsageMetrics(event: ethereum.Event, accountAddress: Address, transactionType: string): void {
    const usageDailyMetric = getOrCreateUsageDailyMetric(event);
    const usageHourlyMetric = getOrCreateUsageHourlyMetric(event);
    const protocol = getOrCreateProtocol();

    ////
    // Updates directly from protocol
    ////
    usageDailyMetric.totalPoolCount = protocol.totalPoolCount;

    ////
    // Update cumulative accounts
    ////
    let account = Account.load(accountAddress.toHexString());
    if (!account) {
        account = new Account(accountAddress.toHexString());
        account.save();

        protocol.cumulativeUniqueUsers += ONE_I32;
        protocol.save();
    }
    usageDailyMetric.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers;
    usageHourlyMetric.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers;

    ////
    // Update active accounts
    ////
    const dailyAccountId = accountAddress.toHexString() + "-" + usageDailyMetric.id;
    const hourlyAccountId = dailyAccountId + "-" + usageHourlyMetric.id;
    let activeDailyAccount = ActiveAccount.load(dailyAccountId);
    let activeHourlyAccount = ActiveAccount.load(hourlyAccountId);

    if (!activeDailyAccount) {
        activeDailyAccount = new ActiveAccount(dailyAccountId);
        activeDailyAccount.save();
        usageDailyMetric.dailyActiveUsers += ONE_I32;
    }

    if (!activeHourlyAccount) {
        activeHourlyAccount = new ActiveAccount(hourlyAccountId);
        activeHourlyAccount.save();
        usageHourlyMetric.hourlyActiveUsers += ONE_I32;
    }

    ////
    // Update tx counts
    ////
    usageDailyMetric.dailyTransactionCount += ONE_I32;
    usageHourlyMetric.hourlyTransactionCount += ONE_I32;
    if (TransactionType.BORROW == transactionType) {
        usageDailyMetric.dailyBorrowCount += ONE_I32;
        usageHourlyMetric.hourlyBorrowCount += ONE_I32;
    } else if (TransactionType.DEPOSIT == transactionType) {
        usageDailyMetric.dailyDepositCount += ONE_I32;
        usageHourlyMetric.hourlyDepositCount += ONE_I32;
    } else if (TransactionType.LIQUIDATE == transactionType) {
        usageDailyMetric.dailyLiquidateCount += ONE_I32;
        usageHourlyMetric.hourlyLiquidateCount += ONE_I32;
    } else if (TransactionType.REPAY == transactionType) {
        usageDailyMetric.dailyRepayCount += ONE_I32;
        usageHourlyMetric.hourlyRepayCount += ONE_I32;
    } else if (TransactionType.STAKE == transactionType) {
        usageDailyMetric._dailyStakeCount += ONE_I32;
        usageHourlyMetric._hourlyStakeCount += ONE_I32;
    } else if (TransactionType.UNSTAKE == transactionType) {
        usageDailyMetric._dailyUnstakeCount += ONE_I32;
        usageHourlyMetric._hourlyUnstakeCount += ONE_I32;
    } else if (TransactionType.WITHDRAW == transactionType) {
        usageDailyMetric.dailyWithdrawCount += ONE_I32;
        usageHourlyMetric.hourlyWithdrawCount += ONE_I32;
    } else if (TransactionType.CLAIM == transactionType) {
        usageDailyMetric._dailyClaimCount += ONE_I32;
        usageHourlyMetric._hourlyClaimCount += ONE_I32;
    } else {
        log.warning("update usage metric called with invalid transactionType: {}", [transactionType]);
    }

    usageDailyMetric.save();
    usageHourlyMetric.save();
}
