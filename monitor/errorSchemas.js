export const protocolErrorMessages = {
    totalValueLockedUSD: "This field on 'Protocol' entity has a value below $0 or above $100,000,000,000.",
    cumulativeSupplySideRevenueUSD: "This field on 'Protocol' entity has a value below $0 or above $100,000,000,000.",
    cumulativeProtocolSideRevenueUSD: "This field on 'Protocol' entity has a value below $0 or above $100,000,000,000.",
    cumulativeTotalRevenueUSD: "'Protocol' entity has a cumulativeTotalRevenueUSD that is not within $1000 of the value of cumulativeProtocolSideRevenueUSD + cumulativeSupplySideRevenueUSD",
    cumulativeVolumeUSD: "This field on 'Protocol' entity has a negative value.",
    cumulativeUniqueUsers: "This field on 'Protocol' entity has a value below 0 or greater than 100,000,000.",
    totalPoolCount: "This field on 'Protocol' entity has less than 0 pools or more than 10,000 pools.",
    cumulativeUniqueDepositors: "'Protocol' entity has fewer cumulativeUniqueUsers than cumulativeUniqueDepositors.",
    cumulativeUniqueBorrowers: "This field on 'Protocol' entity has a fewer cumulativeUniqueUsers than cumulativeUniqueBorrowers.",
    cumulativeUniqueLiquidators: "This field on 'Protocol' entity has less cumulativeUniqueUsers than cumulativeUniqueLiquidators.",
    cumulativeUniqueLiquidatees: "This field on 'Protocol' entity has less cumulativeUniqueUsers than cumulativeUniqueLiquidatees.",
    openPositionCount: "This field on 'Protocol' entity has a value below 0 or greater than 1,000,000,000.",
    cumulativePositionCount: "'Protocol' entity has a lower openPositionCount than cumulativePositionCount.",
    totalDepositBalanceUSD: "This field on 'Protocol' entity has a value less than $0 or greater than $100,000,000,000.",
    cumulativeDepositUSD: "'Protocol' entity has a lower cumulativeDepositUSD than totalDepositBalanceUSD.",
    totalBorrowBalanceUSD: "'Protocol' entity has a lower totalDepositBalanceUSD than totalBorrowBalanceUSD.",
    cumulativeLiquidateUSD: "'Protocol' entity has a lower cumulativeBorrowUSD than cumulativeLiquidateUSD.",
    protocolEntity: "'Protocol' entity has zero instances.",
    relatedField: "'Value' on 'Protocol' entity is null/[] but should be holding valid instances of another entity.",
    queryError: "Querying the 'Protocol' entity returned error messages."
};

export const poolErrorMessages = {
    totalValueLockedUSD: "The pools listed have a TVL below $0 or above $100,000,000,000.",
    cumulativeSupplySideRevenueUSD: "The pools listed have a cumulativeSupplySideRevenueUSD below $0 or above $10,000,000,000.",
    cumulativeProtocolSideRevenueUSD: "The pools listed have a cumulativeProtocolSideRevenueUSD below $0 or above $10,000,000,000.",
    cumulativeTotalRevenueUSD: "The pools listed have a cumulativeTotalRevenueUSD value unequal to the sum of cumulativeSupplySideRevenueUSD and cumulativeProtocolSideRevenueUSD.",
    cumulativeDepositUSD: "The pools listed have a cumulativeDepositUSD below $0.",
    cumulativeBorrowUSD: "The pools listed have a cumulativeBorrowUSD value above the cumulativeDepositUSD value.",
    cumulativeLiquidateUSD: "The pools listed have a cumulativeLiquidateUSD value above the cumulativeBorrowUSD value.",
    totalDepositBalanceUSD: "The pools listed have a totalDepositBalanceUSD below $0 or above $100,000,000,000.",
    totalBorrowBalanceUSD: "The pools listed have a totalBorrowBalanceUSD value above the totalDepositBalanceUSD value.",
    outputTokenSupply: "The pools listed have an outputTokenSupply value of zero or less.",
    outputTokenPriceUSD: "The pools listed have an outputTokenPriceUSD value below $0 or above $100,000",
    cumulativeVolumeUSD: "The pools listed have a cumulativeVolumeUSD value below $0 or above $10,000,000,000."
};

export const protocolErrors = {
    totalValueLockedUSD: [],
    cumulativeSupplySideRevenueUSD: [],
    cumulativeProtocolSideRevenueUSD: [],
    cumulativeTotalRevenueUSD: [],
    cumulativeVolumeUSD: [],
    cumulativeUniqueUsers: [],
    totalPoolCount: [],
    cumulativeUniqueDepositors: [],
    cumulativeUniqueBorrowers: [],
    cumulativeUniqueLiquidators: [],
    cumulativeUniqueLiquidatees: [],
    openPositionCount: [],
    cumulativePositionCount: [],
    totalDepositBalanceUSD: [],
    cumulativeDepositUSD: [],
    totalBorrowBalanceUSD: [],
    cumulativeLiquidateUSD: [],
    protocolEntity: [],
    relatedField: [],
    queryError: []
};

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
};
