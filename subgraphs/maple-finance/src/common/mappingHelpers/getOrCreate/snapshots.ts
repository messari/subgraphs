import { ethereum } from "@graphprotocol/graph-ts";

import {
    FinancialsDailySnapshot,
    Market,
    MarketDailySnapshot,
    MarketHourlySnapshot,
    UsageMetricsDailySnapshot,
    UsageMetricsHourlySnapshot
} from "../../../../generated/schema";

import { PROTOCOL_ID, SEC_PER_DAY, SEC_PER_HOUR, ZERO_BD, ZERO_BI, ZERO_I32 } from "../../constants";
import { getOrCreateProtocol } from "./spawners";

export function getOrCreateFinancialDailyMetric(event: ethereum.Event): FinancialsDailySnapshot {
    const dayNumber = event.block.timestamp.div(SEC_PER_DAY);
    let financialMetric = FinancialsDailySnapshot.load(dayNumber.toString());

    if (!financialMetric) {
        financialMetric = new FinancialsDailySnapshot(dayNumber.toString());

        const protocol = getOrCreateProtocol();
        const timestamp = dayNumber.times(SEC_PER_DAY); // Rounded to the start of the day

        financialMetric.protocol = protocol.id;
        financialMetric.blockNumber = event.block.number;
        financialMetric.timestamp = timestamp;

        financialMetric.totalValueLockedUSD = protocol.totalValueLockedUSD;
        financialMetric.protocolControlledValueUSD = protocol.protocolControlledValueUSD;
        financialMetric.mintedTokenSupplies = protocol.mintedTokenSupplies;
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

export function getOrCreateUsageDailyMetric(event: ethereum.Event): UsageMetricsDailySnapshot {
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
        usageMetric._dailyClaimCount = ZERO_I32;
    }

    return usageMetric;
}

export function getOrCreateUsageHourlyMetric(event: ethereum.Event): UsageMetricsHourlySnapshot {
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
        usageMetric._hourlyClaimCount = ZERO_I32;
    }

    return usageMetric;
}

export function getOrCreateMarketDailySnapshot(market: Market, event: ethereum.Event): MarketDailySnapshot {
    const dayNumber = event.block.timestamp.div(SEC_PER_DAY);
    const snapshotId = market.id + "-" + dayNumber.toString();
    let marketSnapshot = MarketDailySnapshot.load(snapshotId);

    if (!marketSnapshot) {
        marketSnapshot = new MarketDailySnapshot(snapshotId);
        const timestamp = dayNumber.times(SEC_PER_DAY); // Rounded to the start of the day

        marketSnapshot.protocol = PROTOCOL_ID;
        marketSnapshot.market = market.id;
        marketSnapshot.blockNumber = event.block.number;
        marketSnapshot.timestamp = timestamp;
        marketSnapshot.rates = market.rates;
        marketSnapshot.totalValueLockedUSD = market.totalValueLockedUSD;
        marketSnapshot.totalDepositBalanceUSD = market.totalDepositBalanceUSD;
        marketSnapshot.cumulativeDepositUSD = market.cumulativeDepositUSD;
        marketSnapshot.totalBorrowBalanceUSD = market.totalBorrowBalanceUSD;
        marketSnapshot.cumulativeBorrowUSD = market.cumulativeBorrowUSD;
        marketSnapshot.cumulativeLiquidateUSD = market.cumulativeLiquidateUSD;
        marketSnapshot.inputTokenBalance = market.inputTokenBalance;
        marketSnapshot.inputTokenPriceUSD = market.inputTokenPriceUSD;
        marketSnapshot.outputTokenSupply = market.outputTokenSupply;
        marketSnapshot.outputTokenPriceUSD = market.outputTokenPriceUSD;
        marketSnapshot.exchangeRate = market.exchangeRate;
        marketSnapshot.rewardTokenEmissionsAmount = market.rewardTokenEmissionsAmount;
        marketSnapshot.rewardTokenEmissionsUSD = market.rewardTokenEmissionsUSD;

        marketSnapshot.dailyDepositUSD = ZERO_BD;
        marketSnapshot.dailyBorrowUSD = ZERO_BD;
        marketSnapshot.dailyLiquidateUSD = ZERO_BD;

        marketSnapshot._txCount = ZERO_BI;
        marketSnapshot._initialDepositUSD = market.totalDepositBalanceUSD;
        marketSnapshot._initialBorrowUSD = market.totalBorrowBalanceUSD;
        marketSnapshot._initialLiquidateUSD = market.cumulativeLiquidateUSD;
    }

    return marketSnapshot;
}

export function getOrCreateMarketHourlySnapshot(market: Market, event: ethereum.Event): MarketHourlySnapshot {
    const hourNumber = event.block.timestamp.div(SEC_PER_HOUR);
    const snapshotId = market.id + "-" + hourNumber.toString();
    let marketSnapshot = MarketHourlySnapshot.load(snapshotId);

    if (!marketSnapshot) {
        marketSnapshot = new MarketHourlySnapshot(snapshotId);
        const timestamp = hourNumber.times(SEC_PER_HOUR); // Rounded to the start of the hour

        marketSnapshot.protocol = PROTOCOL_ID;
        marketSnapshot.market = market.id;
        marketSnapshot.blockNumber = event.block.number;
        marketSnapshot.timestamp = timestamp;
        marketSnapshot.rates = market.rates;
        marketSnapshot.totalValueLockedUSD = market.totalValueLockedUSD;
        marketSnapshot.totalDepositBalanceUSD = market.totalDepositBalanceUSD;
        marketSnapshot.cumulativeDepositUSD = market.cumulativeDepositUSD;
        marketSnapshot.totalBorrowBalanceUSD = market.totalBorrowBalanceUSD;
        marketSnapshot.cumulativeBorrowUSD = market.cumulativeBorrowUSD;
        marketSnapshot.cumulativeLiquidateUSD = market.cumulativeLiquidateUSD;
        marketSnapshot.inputTokenBalance = market.inputTokenBalance;
        marketSnapshot.inputTokenPriceUSD = market.inputTokenPriceUSD;
        marketSnapshot.outputTokenSupply = market.outputTokenSupply;
        marketSnapshot.outputTokenPriceUSD = market.outputTokenPriceUSD;
        marketSnapshot.exchangeRate = market.exchangeRate;
        marketSnapshot.rewardTokenEmissionsAmount = market.rewardTokenEmissionsAmount;
        marketSnapshot.rewardTokenEmissionsUSD = market.rewardTokenEmissionsUSD;

        marketSnapshot.hourlyDepositUSD = ZERO_BD;
        marketSnapshot.hourlyBorrowUSD = ZERO_BD;
        marketSnapshot.hourlyLiquidateUSD = ZERO_BD;

        marketSnapshot._txCount = ZERO_BI;
        marketSnapshot._initialDepositUSD = market.totalDepositBalanceUSD;
        marketSnapshot._initialBorrowUSD = market.totalBorrowBalanceUSD;
        marketSnapshot._initialLiquidateUSD = market.cumulativeLiquidateUSD;
    }

    return marketSnapshot;
}
