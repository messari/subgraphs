import { Address, BigDecimal, BigInt, ethereum, log } from "@graphprotocol/graph-ts";

import { Account, ActiveAccount, Market } from "../../../../generated/schema";

import { ONE_BI, ONE_I32, TransactionType } from "../../constants";
import { bigDecimalToBigInt, computeNewAverage } from "../../utils";
import {
    getOrCreateFinancialDailyMetric,
    getOrCreateMarketDailySnapshot,
    getOrCreateMarketHourlySnapshot,
    getOrCreateUsageDailyMetric,
    getOrCreateUsageHourlyMetric
} from "../getOrCreate/snapshots";
import { getOrCreateProtocol } from "../getOrCreate/spawners";

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

export function updateMarketDailySnapshots(market: Market, event: ethereum.Event): void {
    const marketSnapshot = getOrCreateMarketDailySnapshot(market, event);

    ////
    // Update direct copies
    ////
    marketSnapshot.rates = market.rates;
    marketSnapshot.rewardTokenEmissionsAmount = market.rewardTokenEmissionsAmount;
    marketSnapshot.rewardTokenEmissionsUSD = market.rewardTokenEmissionsUSD;

    ////
    // Update averages
    ////
    const txCount = marketSnapshot._txCount;

    marketSnapshot.totalValueLockedUSD = computeNewAverage(
        marketSnapshot.totalValueLockedUSD,
        txCount,
        market.totalValueLockedUSD
    );

    marketSnapshot.totalDepositBalanceUSD = computeNewAverage(
        marketSnapshot.totalDepositBalanceUSD,
        txCount,
        market.totalDepositBalanceUSD
    );

    marketSnapshot.cumulativeDepositUSD = computeNewAverage(
        marketSnapshot.cumulativeDepositUSD,
        txCount,
        market.cumulativeDepositUSD
    );

    marketSnapshot.cumulativeBorrowUSD = computeNewAverage(
        marketSnapshot.cumulativeBorrowUSD,
        txCount,
        market.cumulativeBorrowUSD
    );

    marketSnapshot.cumulativeLiquidateUSD = computeNewAverage(
        marketSnapshot.cumulativeLiquidateUSD,
        txCount,
        market.cumulativeLiquidateUSD
    );

    marketSnapshot.inputTokenBalance = bigDecimalToBigInt(
        computeNewAverage(
            marketSnapshot.inputTokenBalance.toBigDecimal(),
            txCount,
            market.inputTokenBalance.toBigDecimal()
        )
    );

    marketSnapshot.inputTokenPriceUSD = computeNewAverage(
        marketSnapshot.inputTokenPriceUSD,
        txCount,
        market.inputTokenPriceUSD
    );

    marketSnapshot.outputTokenSupply = bigDecimalToBigInt(
        computeNewAverage(
            marketSnapshot.outputTokenSupply.toBigDecimal(),
            txCount,
            market.outputTokenSupply.toBigDecimal()
        )
    );

    marketSnapshot.outputTokenPriceUSD = computeNewAverage(
        marketSnapshot.outputTokenPriceUSD,
        txCount,
        market.outputTokenPriceUSD
    );

    marketSnapshot.exchangeRate = computeNewAverage(marketSnapshot.exchangeRate, txCount, market.exchangeRate);

    ////
    // Update snapshot cumulatives
    ////
    marketSnapshot.dailyDepositUSD = market.totalDepositBalanceUSD.minus(marketSnapshot._initialDepositUSD);
    marketSnapshot.dailyBorrowUSD = market.totalBorrowBalanceUSD.minus(marketSnapshot._initialBorrowUSD);
    marketSnapshot.dailyLiquidateUSD = market.cumulativeLiquidateUSD.minus(marketSnapshot._initialLiquidateUSD);

    ////
    // Update tx count
    ////
    marketSnapshot._txCount = txCount.plus(ONE_BI);

    marketSnapshot.save();
}

export function updateMarketHourlySnapshots(market: Market, event: ethereum.Event): void {
    const marketSnapshot = getOrCreateMarketHourlySnapshot(market, event);

    ////
    // Update direct copies
    ////
    marketSnapshot.rates = market.rates;
    marketSnapshot.rewardTokenEmissionsAmount = market.rewardTokenEmissionsAmount;
    marketSnapshot.rewardTokenEmissionsUSD = market.rewardTokenEmissionsUSD;

    ////
    // Update averages
    ////
    const txCount = marketSnapshot._txCount;

    marketSnapshot.totalValueLockedUSD = computeNewAverage(
        marketSnapshot.totalValueLockedUSD,
        txCount,
        market.totalValueLockedUSD
    );

    marketSnapshot.totalDepositBalanceUSD = computeNewAverage(
        marketSnapshot.totalDepositBalanceUSD,
        txCount,
        market.totalDepositBalanceUSD
    );

    marketSnapshot.cumulativeDepositUSD = computeNewAverage(
        marketSnapshot.cumulativeDepositUSD,
        txCount,
        market.cumulativeDepositUSD
    );

    marketSnapshot.cumulativeBorrowUSD = computeNewAverage(
        marketSnapshot.cumulativeBorrowUSD,
        txCount,
        market.cumulativeBorrowUSD
    );

    marketSnapshot.cumulativeLiquidateUSD = computeNewAverage(
        marketSnapshot.cumulativeLiquidateUSD,
        txCount,
        market.cumulativeLiquidateUSD
    );

    marketSnapshot.inputTokenBalance = bigDecimalToBigInt(
        computeNewAverage(
            marketSnapshot.inputTokenBalance.toBigDecimal(),
            txCount,
            market.inputTokenBalance.toBigDecimal()
        )
    );

    marketSnapshot.inputTokenPriceUSD = computeNewAverage(
        marketSnapshot.inputTokenPriceUSD,
        txCount,
        market.inputTokenPriceUSD
    );

    marketSnapshot.outputTokenSupply = bigDecimalToBigInt(
        computeNewAverage(
            marketSnapshot.outputTokenSupply.toBigDecimal(),
            txCount,
            market.outputTokenSupply.toBigDecimal()
        )
    );

    marketSnapshot.outputTokenPriceUSD = computeNewAverage(
        marketSnapshot.outputTokenPriceUSD,
        txCount,
        market.outputTokenPriceUSD
    );

    marketSnapshot.exchangeRate = computeNewAverage(marketSnapshot.exchangeRate, txCount, market.exchangeRate);

    ////
    // Update snapshot cumulatives
    ////
    marketSnapshot.hourlyDepositUSD = market.totalDepositBalanceUSD.minus(marketSnapshot._initialDepositUSD);
    marketSnapshot.hourlyBorrowUSD = market.totalBorrowBalanceUSD.minus(marketSnapshot._initialBorrowUSD);
    marketSnapshot.hourlyLiquidateUSD = market.cumulativeLiquidateUSD.minus(marketSnapshot._initialLiquidateUSD);

    ////
    // Update tx count
    ////
    marketSnapshot._txCount = txCount.plus(ONE_BI);

    marketSnapshot.save();
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
    } else if (TransactionType.CLAIM == transactionType) {
        usageDailyMetric._dailyClaimCount += ONE_I32;
        usageHourlyMetric._hourlyClaimCount += ONE_I32;
    } else {
        log.warning("update usage metric called with invalid transactionType: {}", [transactionType]);
    }

    usageDailyMetric.save();
    usageHourlyMetric.save();
}
