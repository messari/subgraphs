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
import { getOrCreateProtocol } from "./protocol";

export function getOrCreateMarketDailySnapshot(event: ethereum.Event, market: Market): MarketDailySnapshot {
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

        marketSnapshot.save();
    }

    return marketSnapshot;
}

export function getOrCreateMarketHourlySnapshot(event: ethereum.Event, market: Market): MarketHourlySnapshot {
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

        marketSnapshot.save();
    }

    return marketSnapshot;
}

export function getOrCreateFinancialsDailySnapshot(event: ethereum.Event): FinancialsDailySnapshot {
    const dayNumber = event.block.timestamp.div(SEC_PER_DAY);
    let financialsSnapshot = FinancialsDailySnapshot.load(dayNumber.toString());

    if (!financialsSnapshot) {
        financialsSnapshot = new FinancialsDailySnapshot(dayNumber.toString());

        const protocol = getOrCreateProtocol();
        const timestamp = dayNumber.times(SEC_PER_DAY); // Rounded to the start of the day

        financialsSnapshot.protocol = protocol.id;
        financialsSnapshot.blockNumber = event.block.number;
        financialsSnapshot.timestamp = timestamp;

        financialsSnapshot.totalValueLockedUSD = protocol.totalValueLockedUSD;
        financialsSnapshot.protocolControlledValueUSD = protocol.protocolControlledValueUSD;
        financialsSnapshot.mintedTokenSupplies = protocol.mintedTokenSupplies;
        financialsSnapshot.cumulativeSupplySideRevenueUSD = protocol.cumulativeSupplySideRevenueUSD;
        financialsSnapshot.cumulativeProtocolSideRevenueUSD = protocol.cumulativeProtocolSideRevenueUSD;
        financialsSnapshot.cumulativeTotalRevenueUSD = protocol.cumulativeTotalRevenueUSD;
        financialsSnapshot.totalDepositBalanceUSD = protocol.totalDepositBalanceUSD;
        financialsSnapshot.cumulativeDepositUSD = protocol.cumulativeDepositUSD;
        financialsSnapshot.totalBorrowBalanceUSD = protocol.totalBorrowBalanceUSD;
        financialsSnapshot.cumulativeBorrowUSD = protocol.cumulativeBorrowUSD;
        financialsSnapshot.cumulativeLiquidateUSD = protocol.cumulativeLiquidateUSD;
        financialsSnapshot._treasuryFee = protocol._treasuryFee;

        financialsSnapshot.dailySupplySideRevenueUSD = ZERO_BD;
        financialsSnapshot.dailyProtocolSideRevenueUSD = ZERO_BD;
        financialsSnapshot.dailyTotalRevenueUSD = ZERO_BD;
        financialsSnapshot.dailyDepositUSD = ZERO_BD;
        financialsSnapshot.dailyBorrowUSD = ZERO_BD;
        financialsSnapshot.dailyLiquidateUSD = ZERO_BD;

        financialsSnapshot.save();
    }

    return financialsSnapshot;
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

        usageMetric.save();
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

        usageMetric.save();
    }

    return usageMetric;
}
