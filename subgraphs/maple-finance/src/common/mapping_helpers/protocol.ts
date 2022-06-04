import { Address, BigDecimal, BigInt, ethereum, log } from "@graphprotocol/graph-ts";
import { ProtocolPaused } from "../../../generated/MapleGlobals/MapleGlobals";
import {
    Account,
    ActiveAccount,
    FinancialsDailySnapshot,
    LendingProtocol,
    UsageMetricsDailySnapshot,
    UsageMetricsHourlySnapshot
} from "../../../generated/schema";

import {
    ONE_BD,
    ONE_BI,
    ONE_I32,
    PROTOCOL_ID,
    PROTOCOL_INITIAL_TREASURY_FEE,
    PROTOCOL_LENDING_TYPE,
    PROTOCOL_METHODOLOGY_VERSION,
    PROTOCOL_NAME,
    PROTOCOL_NETWORK,
    PROTOCOL_RISK_TYPE,
    PROTOCOL_SCHEMA_VERSION,
    PROTOCOL_SLUG,
    PROTOCOL_SUBGRAPH_VERSION,
    PROTOCOL_TYPE,
    SEC_PER_DAY,
    SEC_PER_HOUR,
    TransactionType,
    ZERO_BD,
    ZERO_BI,
    ZERO_I32
} from "../constants";
import { computeNewAverage } from "../utils";

export function getOrCreateProtocol(): LendingProtocol {
    let protocol = LendingProtocol.load(PROTOCOL_ID);

    if (!protocol) {
        protocol = new LendingProtocol(PROTOCOL_ID);

        protocol.name = PROTOCOL_NAME;
        protocol.slug = PROTOCOL_SLUG;
        protocol.schemaVersion = PROTOCOL_SCHEMA_VERSION;
        protocol.subgraphVersion = PROTOCOL_SUBGRAPH_VERSION;
        protocol.methodologyVersion = PROTOCOL_METHODOLOGY_VERSION;
        protocol.network = PROTOCOL_NETWORK;
        protocol.type = PROTOCOL_TYPE;
        protocol.lendingType = PROTOCOL_LENDING_TYPE;
        protocol.riskType = PROTOCOL_RISK_TYPE;
        protocol.mintedTokens = new Array<string>();
        protocol.cumulativeUniqueUsers = ZERO_I32;
        protocol.totalValueLockedUSD = ZERO_BD;
        protocol.protocolControlledValueUSD = ZERO_BD;
        protocol.cumulativeSupplySideRevenueUSD = ZERO_BD;
        protocol.cumulativeProtocolSideRevenueUSD = ZERO_BD;
        protocol.cumulativeTotalRevenueUSD = ZERO_BD;
        protocol.totalDepositBalanceUSD = ZERO_BD;
        protocol.cumulativeDepositUSD = ZERO_BD;
        protocol.totalBorrowBalanceUSD = ZERO_BD;
        protocol.cumulativeBorrowUSD = ZERO_BD;
        protocol.cumulativeLiquidateUSD = ZERO_BD;
        protocol.mintedTokenSupplies = new Array<BigInt>();
        protocol._treasuryFee = PROTOCOL_INITIAL_TREASURY_FEE;

        protocol.save();
    }

    return protocol;
}

function getOrCreateFinancialDailyMetric(event: ethereum.Event): FinancialsDailySnapshot {
    const dayNumber = event.block.timestamp.div(SEC_PER_DAY);
    let financialMetric = FinancialsDailySnapshot.load(dayNumber.toString());

    if (!financialMetric) {
        financialMetric = new FinancialsDailySnapshot(dayNumber.toString());

        const protocol = getOrCreateProtocol();
        const timestamp = dayNumber.times(SEC_PER_DAY); // Rounded to the start of the day

        financialMetric.protocol = protocol.id;
        financialMetric.blockNumber = event.block.number;
        financialMetric.timestamp = timestamp;

        financialMetric.mintedTokenSupplies = protocol.mintedTokenSupplies;

        financialMetric.totalValueLockedUSD = protocol.totalValueLockedUSD;
        financialMetric.protocolControlledValueUSD = protocol.protocolControlledValueUSD;
        financialMetric.cumulativeSupplySideRevenueUSD = protocol.cumulativeSupplySideRevenueUSD;
        financialMetric.cumulativeProtocolSideRevenueUSD = protocol.cumulativeProtocolSideRevenueUSD;
        financialMetric.cumulativeTotalRevenueUSD = protocol.cumulativeTotalRevenueUSD;
        financialMetric.totalDepositBalanceUSD = protocol.totalDepositBalanceUSD;
        financialMetric.cumulativeDepositUSD = protocol.cumulativeDepositUSD;
        financialMetric.totalBorrowBalanceUSD = protocol.totalBorrowBalanceUSD;
        financialMetric.cumulativeBorrowUSD = protocol.cumulativeBorrowUSD;
        financialMetric.cumulativeLiquidateUSD = protocol.cumulativeLiquidateUSD;

        financialMetric.dailySupplySideRevenueUSD = ZERO_BD;
        financialMetric.dailyProtocolSideRevenueUSD = ZERO_BD;
        financialMetric.dailyTotalRevenueUSD = ZERO_BD;
        financialMetric.dailyDepositUSD = ZERO_BD;
        financialMetric.dailyBorrowUSD = ZERO_BD;
        financialMetric.dailyLiquidateUSD = ZERO_BD;

        financialMetric._txCount = ZERO_BI;

        financialMetric._initialSupplySideRevenueUSD = protocol.cumulativeSupplySideRevenueUSD;
        financialMetric._initialProtocolSideRevenueUSD = protocol.cumulativeProtocolSideRevenueUSD;
        financialMetric._initialTotalRevenueUSD = protocol.cumulativeTotalRevenueUSD;
        financialMetric._initialDepositUSD = protocol.totalDepositBalanceUSD;
        financialMetric._initialBorrowUSD = protocol.totalBorrowBalanceUSD;
        financialMetric._initialLiquidateUSD = protocol.cumulativeLiquidateUSD;
    }

    return financialMetric;
}

/**
 * Update financial metrics, this should be called anytime protocol financials are updated.
 * @param event
 */
export function updateFinancialMetrics(event: ethereum.Event): void {
    const protocol = getOrCreateProtocol();
    const financialDailyMetric = getOrCreateFinancialDailyMetric(event);

    financialDailyMetric.mintedTokenSupplies = protocol.mintedTokenSupplies;

    ////
    // Update averages
    ////
    const txCount = financialDailyMetric._txCount;

    financialDailyMetric.totalValueLockedUSD = computeNewAverage(
        financialDailyMetric.totalValueLockedUSD,
        txCount,
        protocol.totalValueLockedUSD
    );

    // Nullable field
    if (protocol.protocolControlledValueUSD && financialDailyMetric.protocolControlledValueUSD) {
        financialDailyMetric.protocolControlledValueUSD = computeNewAverage(
            <BigDecimal>financialDailyMetric.protocolControlledValueUSD,
            txCount,
            <BigDecimal>protocol.protocolControlledValueUSD
        );
    }

    financialDailyMetric.cumulativeSupplySideRevenueUSD = computeNewAverage(
        financialDailyMetric.cumulativeSupplySideRevenueUSD,
        txCount,
        protocol.cumulativeSupplySideRevenueUSD
    );

    financialDailyMetric.cumulativeProtocolSideRevenueUSD = computeNewAverage(
        financialDailyMetric.cumulativeProtocolSideRevenueUSD,
        txCount,
        protocol.cumulativeProtocolSideRevenueUSD
    );

    financialDailyMetric.cumulativeTotalRevenueUSD = computeNewAverage(
        financialDailyMetric.cumulativeTotalRevenueUSD,
        txCount,
        protocol.cumulativeTotalRevenueUSD
    );

    financialDailyMetric.totalDepositBalanceUSD = computeNewAverage(
        financialDailyMetric.totalDepositBalanceUSD,
        txCount,
        protocol.totalDepositBalanceUSD
    );

    financialDailyMetric.cumulativeDepositUSD = computeNewAverage(
        financialDailyMetric.cumulativeDepositUSD,
        txCount,
        protocol.cumulativeDepositUSD
    );

    financialDailyMetric.totalBorrowBalanceUSD = computeNewAverage(
        financialDailyMetric.totalBorrowBalanceUSD,
        txCount,
        protocol.totalBorrowBalanceUSD
    );

    financialDailyMetric.cumulativeBorrowUSD = computeNewAverage(
        financialDailyMetric.cumulativeBorrowUSD,
        txCount,
        protocol.cumulativeBorrowUSD
    );

    financialDailyMetric.cumulativeLiquidateUSD = computeNewAverage(
        financialDailyMetric.cumulativeLiquidateUSD,
        txCount,
        protocol.cumulativeLiquidateUSD
    );

    ////
    // Update snapshot cumulatives
    ////
    financialDailyMetric.dailySupplySideRevenueUSD = protocol.cumulativeSupplySideRevenueUSD.minus(
        financialDailyMetric._initialSupplySideRevenueUSD
    );

    financialDailyMetric.dailyTotalRevenueUSD = protocol.cumulativeTotalRevenueUSD.minus(
        financialDailyMetric._initialTotalRevenueUSD
    );

    financialDailyMetric.dailyDepositUSD = protocol.totalDepositBalanceUSD.minus(
        financialDailyMetric._initialDepositUSD
    );

    financialDailyMetric.dailyBorrowUSD = protocol.totalBorrowBalanceUSD.minus(financialDailyMetric._initialBorrowUSD);

    financialDailyMetric.dailyLiquidateUSD = protocol.cumulativeLiquidateUSD.minus(
        financialDailyMetric._initialLiquidateUSD
    );

    ////
    // Update tx count
    ////
    financialDailyMetric._txCount = txCount.plus(ONE_BI);

    financialDailyMetric.save();
}

function getOrCreateUsageDailyMetric(event: ethereum.Event): UsageMetricsDailySnapshot {
    const dayNumber = event.block.timestamp.div(SEC_PER_DAY);
    let usageMetric = UsageMetricsDailySnapshot.load(dayNumber.toString());

    if (!usageMetric) {
        usageMetric = new UsageMetricsDailySnapshot(dayNumber.toString());

        const protocol = getOrCreateProtocol();

        const timestamp = dayNumber.times(SEC_PER_DAY); // Rounded to the start of the day
        usageMetric.timestamp = timestamp;
        usageMetric.blockNumber = event.block.number;

        usageMetric.protocol = protocol.id;
        usageMetric.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers;

        usageMetric.dailyActiveUsers = ZERO_I32;
        usageMetric.dailyTransactionCount = ZERO_I32;
        usageMetric.dailyDepositCount = ZERO_I32;
        usageMetric.dailyWithdrawCount = ZERO_I32;
        usageMetric.dailyBorrowCount = ZERO_I32;
        usageMetric.dailyRepayCount = ZERO_I32;
        usageMetric.dailyLiquidateCount = ZERO_I32;
        usageMetric.dailyBorrowCount = ZERO_I32;
        usageMetric._dailyStakeCount = ZERO_I32;
        usageMetric._dailyUnstakeCount = ZERO_I32;
    }

    return usageMetric;
}

function getOrCreateUsageHourlyMetric(event: ethereum.Event): UsageMetricsHourlySnapshot {
    const hourNumber = event.block.timestamp.div(SEC_PER_HOUR);
    let usageMetric = UsageMetricsHourlySnapshot.load(hourNumber.toString());

    if (!usageMetric) {
        usageMetric = new UsageMetricsHourlySnapshot(hourNumber.toString());

        const protocol = getOrCreateProtocol();

        const timestamp = hourNumber.times(SEC_PER_HOUR); // Rounded to the start of the hour
        usageMetric.timestamp = timestamp;
        usageMetric.blockNumber = event.block.number;

        usageMetric.protocol = protocol.id;
        usageMetric.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers;

        usageMetric.hourlyActiveUsers = ZERO_I32;

        usageMetric.hourlyTransactionCount = ZERO_I32;

        usageMetric.hourlyDepositCount = ZERO_I32;
        usageMetric.hourlyWithdrawCount = ZERO_I32;
        usageMetric.hourlyBorrowCount = ZERO_I32;
        usageMetric.hourlyRepayCount = ZERO_I32;
        usageMetric.hourlyLiquidateCount = ZERO_I32;
        usageMetric.hourlyBorrowCount = ZERO_I32;
        usageMetric._hourlyStakeCount = ZERO_I32;
        usageMetric._hourlyUnstakeCount = ZERO_I32;
    }

    return usageMetric;
}

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
    // Update cumulative accounts
    ////
    let account = Account.load(accountAddress.toHexString());
    if (!account) {
        account = new Account(accountAddress.toHexString());

        protocol.cumulativeUniqueUsers += ONE_I32;
        usageDailyMetric.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers;
        usageHourlyMetric.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers;

        account.save();
        protocol.save();
    }

    ////
    // Update active accounts
    ////
    const dailyAccountId = accountAddress.toHexString() + "-" + usageDailyMetric.id;
    const hourlyAccountId = dailyAccountId + "-" + usageHourlyMetric.id;
    let activeDailyAccount = ActiveAccount.load(dailyAccountId);
    let activeHourlyAccount = ActiveAccount.load(hourlyAccountId);

    if (!activeDailyAccount) {
        activeDailyAccount = new ActiveAccount(dailyAccountId);
        usageDailyMetric.dailyActiveUsers += ONE_I32;
        activeDailyAccount.save();
    }

    if (!activeHourlyAccount) {
        activeHourlyAccount = new ActiveAccount(hourlyAccountId);
        usageHourlyMetric.hourlyActiveUsers += ONE_I32;
        activeHourlyAccount.save();
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
    } else {
        log.warning("update usage metric called with invalid transactionType: {}", [transactionType]);
    }

    usageDailyMetric.save();
    usageHourlyMetric.save();
}
