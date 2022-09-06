export const protocolErrorMessages = {
    tvlRange: "Protocol level totalValueLockedUSD out of normal range. The protocols listed below have greater than $10000 or less than $100000000000.",
    cumulativeSupplySideRev: "Protocol level cumulativeSupplySideRevenueUSD out of normal range. The protocols listed below have less than $1000 or greater than $100000000000.",
    cumulativeProtocolSideRev: "Protocol level cumulativeProtocolSideRev out of normal range. The protocols listed below have less than $1000 or greater than $100000000000.",
    cumulativeTotalRev: "Protocol level cumulativeTotalRevenueUSD has an unexpected value. The protocols listed below have a cumulativeTotalRevenueUSD that does not equal cumulativeProtocolSideRevenueUSD + cumulativeSupplySideRevenueUSD.",
    cumulativeVol: "Protocol level cumulativeVolumeUSD out of normal range. The protocols listed below have less than $10000.",
    cumulativeUniqueUsers: "Protocol level cumulativeUniqueUsers out of normal range. The protocols listed below have less than 100 or greater than 100000000 unique users.",
    totalPoolCount: "Protocol level totalPoolCount out of normal range. The protocols listed below have 0 pools or greater than 10000 pools.",
    cumulativeUniqueDepos: "Protocol level cumulativeUniqueDepositors has an unexpected value. The protocols listed below have less cumulative unique users than cumulative unique depositors.",
    cumulativeUniqueBorrowers: "Protocol level cumulativeUniqueBorrowers has an unexpected value. The protocols listed below have less cumulative unique users than cumulative unique borrowers.",
    cumulativeUniqueLiquidators: "Protocol level cumulativeUniqueLiquidators has an unexpected value. The protocols listed below have less cumulative unique users than cumulative unique liquidators.",
    cumulativeUniqueLiquidatees: "Protocol level cumulativeUniqueLiquidatees has an unexpected value. The protocols listed below have less cumulative unique users than cumulative unique liquidatees.",
    openPositionCount: "Protocol level openPositionCount out of normal range. The protocols listed below have less than 100 or greater than 1000000000.",
    cumulativePositionCount: "Protocol level cumulativePositionCount has an unexpected value. The protocols listed below have a lower openPositionCount than cumulativePositionCount.",
    totalDepoBal: "Protocol level totalDepositBalanceUSD out of normal range. The protocols listed below have less than $1000 or greater than $100000000000.",
    cumulativeDepo: "Protocol level cumulativeDepositUSD has an unexpected value. The protocols listed below have a lower cumulativeDepositUSD than totalDepositBalanceUSD.",
    totalBorrowBal: "Protocol level totalBorrowBalanceUSD has an unexpected value. The protocols listed below have a lower totalDepositBalanceUSD than totalBorrowBalanceUSD.",
    cumulativeLiquidate: "Protocol level cumulativeLiquidateUSD has an unexpected value. The protocols listed below have a lower cumulativeBorrowUSD than cumulativeLiquidateUSD.",
}

export const poolErrorMessages = {
    totalValueLockedUSD: "The pools listed have a TVL below $1000 or above $100000000000.",
    cumulativeSupplySideRevenueUSD: "The pools listed have a cumulativeSupplySideRevenueUSD below $100 or above $10000000000.",
    cumulativeProtocolSideRevenueUSD: "The pools listed have a cumulativeProtocolSideRevenueUSD below $100 or above $10000000000.",
    cumulativeTotalRevenueUSD: "The pools listed have a cumulativeTotalRevenueUSD value unequal to the sum of cumulativeSupplySideRevenueUSD and cumulativeProtocolSideRevenueUSD.",
    cumulativeDepositUSD: "The pools listed have a cumulativeDepositUSD below $100.",
    cumulativeBorrowUSD: "The pools listed have a cumulativeBorrowUSD value above the cumulativeDepositUSD value.",
    cumulativeLiquidateUSD: "The pools listed have a cumulativeLiquidateUSD value above the cumulativeBorrowUSD value.",
    totalDepositBalanceUSD: "The pools listed have a totalDepositBalanceUSD below $1000 or above $100000000000.",
    totalBorrowBalanceUSD: "The pools listed have a totalBorrowBalanceUSD value above the totalDepositBalanceUSD value.",
    outputTokenSupply: "The pools listed have an outputTokenSupply value of zero or less.",
    outputTokenPriceUSD: "The pools listed have an outputTokenPriceUSD value below $0 or above $100000",
    cumulativeVolumeUSD: "The pools listed have a cumulativeVolumeUSD value below $100 or above $10000000000."
}

export const errorsObj = {
    lending: {
        totalValueLockedUSD: [],
        cumulativeSupplySideRevenueUSD: [],
        cumulativeProtocolSideRevenueUSD: [],
        cumulativeTotalRevenueUSD: [],
        cumulativeDepositUSD: [],
        cumulativeBorrowUSD: [],
        cumulativeLiquidateUSD: [],
        totalBorrowBalanceUSD: [],
        totalDepositBalanceUSD: [],
        outputTokenSupply: [],
        outputTokenPriceUSD: [],
    },
    exchanges: {
        totalValueLockedUSD: [],
        cumulativeSupplySideRevenueUSD: [],
        cumulativeProtocolSideRevenueUSD: [],
        cumulativeTotalRevenueUSD: [],
        cumulativeDepositUSD: [],
        cumulativeVolumeUSD: [],
        outputTokenSupply: [],
        outputTokenPriceUSD: [],
    },
    vaults: {
        totalValueLockedUSD: [],
        cumulativeSupplySideRevenueUSD: [],
        cumulativeProtocolSideRevenueUSD: [],
        cumulativeTotalRevenueUSD: [],
        outputTokenSupply: [],
        outputTokenPriceUSD: [],
    }
}
