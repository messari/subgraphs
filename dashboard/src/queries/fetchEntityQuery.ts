import { gql } from "@apollo/client";
import { ProtocolType, Versions } from "../constants";

export const queryOnEntity = (protocolType: string, schemaVersion: string, timestampLt: number, timestampGt: number, entityName: string) => {
    switch (entityName) {
        case 'financialsDailySnapshots':
            return financialsDailySnapshotsQuery(protocolType, schemaVersion, timestampLt, timestampGt);
        default:
            return financialsDailySnapshotsQuery(protocolType, schemaVersion, timestampLt, timestampGt);
    }
};

const financialsDailySnapshotsQuery = (protocolType: string, schemaVersion: string, timestampLt: number, timestampGt: number) => {
    let queryString = `{
        financialsDailySnapshots(first: 1000, where: {timestamp_gt: ${timestampGt}, timestamp_lt: ${timestampLt}}, orderBy: timestamp, orderDirection: desc) {
            id
            totalValueLockedUSD
            timestamp
        `;

    if (protocolType === ProtocolType.EXCHANGE) {
        const versionGroupArr = schemaVersion.split(".");
        versionGroupArr.pop();
        const versionGroup = versionGroupArr.join(".") + ".0";
        if (versionGroup === Versions.Schema130) {
            queryString += `
            dailyVolumeUSD
            cumulativeVolumeUSD
            dailySupplySideRevenueUSD
            cumulativeSupplySideRevenueUSD
            dailyProtocolSideRevenueUSD
            cumulativeProtocolSideRevenueUSD
            dailyTotalRevenueUSD
            cumulativeTotalRevenueUSD
            `;
        } else if (versionGroup === Versions.Schema200) {
            queryString += `
            dailyVolumeUSD
            cumulativeVolumeUSD
            dailySupplySideRevenueUSD
            cumulativeSupplySideRevenueUSD
            dailyProtocolSideRevenueUSD
            cumulativeProtocolSideRevenueUSD
            dailyTotalRevenueUSD
            cumulativeTotalRevenueUSD
            `;
        } else {
            queryString += `
            dailyVolumeUSD
            cumulativeVolumeUSD
            dailySupplySideRevenueUSD
            cumulativeSupplySideRevenueUSD
            dailyProtocolSideRevenueUSD
            cumulativeProtocolSideRevenueUSD
            dailyTotalRevenueUSD
            cumulativeTotalRevenueUSD
            `;
        }
    } else if (protocolType === ProtocolType.LENDING) {
        const versionGroupArr = schemaVersion.split(".");
        versionGroupArr.pop();
        const versionGroup = versionGroupArr.join(".") + ".0";
        if (versionGroup === Versions.Schema130) {
            queryString += `
            dailySupplySideRevenueUSD
            cumulativeSupplySideRevenueUSD
            dailyProtocolSideRevenueUSD
            cumulativeProtocolSideRevenueUSD
            dailyTotalRevenueUSD
            cumulativeTotalRevenueUSD
            totalBorrowBalanceUSD
            dailyBorrowUSD
            cumulativeBorrowUSD
            totalDepositBalanceUSD
            dailyDepositUSD
            cumulativeDepositUSD
            dailyLiquidateUSD
            cumulativeLiquidateUSD
            mintedTokenSupplies
            `;
        } else if (versionGroup === Versions.Schema200) {
            queryString += `
            dailySupplySideRevenueUSD
            cumulativeSupplySideRevenueUSD
            dailyProtocolSideRevenueUSD
            cumulativeProtocolSideRevenueUSD
            dailyTotalRevenueUSD
            cumulativeTotalRevenueUSD
            totalBorrowBalanceUSD
            dailyBorrowUSD
            cumulativeBorrowUSD
            totalDepositBalanceUSD
            dailyDepositUSD
            cumulativeDepositUSD
            dailyLiquidateUSD
            cumulativeLiquidateUSD
            mintedTokenSupplies
            `;
        } else {
            queryString += `
            dailySupplySideRevenueUSD
            cumulativeSupplySideRevenueUSD
            dailyProtocolSideRevenueUSD
            cumulativeProtocolSideRevenueUSD
            dailyTotalRevenueUSD
            cumulativeTotalRevenueUSD
            totalBorrowBalanceUSD
            dailyBorrowUSD
            cumulativeBorrowUSD
            totalDepositBalanceUSD
            dailyDepositUSD
            cumulativeDepositUSD
            dailyLiquidateUSD
            cumulativeLiquidateUSD
            mintedTokenSupplies
            `;
        }

    } else if (protocolType === ProtocolType.YIELD) {

        const versionGroupArr = schemaVersion.split(".");
        versionGroupArr.pop();
        const versionGroup = versionGroupArr.join(".") + ".0";
        if (versionGroup === Versions.Schema130) {
            queryString += `
            dailySupplySideRevenueUSD
            cumulativeSupplySideRevenueUSD
            dailyProtocolSideRevenueUSD
            cumulativeProtocolSideRevenueUSD
            dailyTotalRevenueUSD
            cumulativeTotalRevenueUSD
            `;
        } else {
            queryString += `
            dailySupplySideRevenueUSD
            cumulativeSupplySideRevenueUSD
            dailyProtocolSideRevenueUSD
            cumulativeProtocolSideRevenueUSD
            dailyTotalRevenueUSD
            cumulativeTotalRevenueUSD
            `;
        }
    } else {
        queryString += `
        totalValueLockedUSD
        dailySupplySideRevenueUSD
        cumulativeSupplySideRevenueUSD
        dailyProtocolSideRevenueUSD
        cumulativeProtocolSideRevenueUSD
        dailyTotalRevenueUSD
        cumulativeTotalRevenueUSD
        `;
    }

    queryString += `}
    }
    `;

    return gql`${queryString}`;
}