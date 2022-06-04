import { BigDecimal, ethereum } from "@graphprotocol/graph-ts";
import { FinancialsDailySnapshot, LendingProtocol } from "../../../generated/schema";

import {
    ONE_BD,
    ONE_BI,
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
    ZERO_BD,
    ZERO_BI
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
        protocol.mintedTokens = [];
        protocol.cumulativeUniqueUsers = 0;
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
        protocol.mintedTokenSupplies = [];
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

export function updateFinancialMetrics(event: ethereum.Event): void {
    const protocol = getOrCreateProtocol();
    const financialDailyMetric = getOrCreateFinancialDailyMetric(event);

    const txCount = financialDailyMetric._txCount;

    financialDailyMetric.mintedTokenSupplies = protocol.mintedTokenSupplies;

    ////
    // Update all averages
    ////
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
