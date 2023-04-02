import { Schema, Versions } from "../../constants";

export const versionsList = ["1.1.0"];

export const schema = (version: string): Schema => {
  // The version group uses the first two digits  of the schema version and defaults to that schema.
  const versionGroupArr = version.split(".");
  versionGroupArr.pop();
  const versionGroup = versionGroupArr.join(".") + ".0";
  switch (versionGroup) {
    case Versions.Schema110:
      return schema110();
    case Versions.Schema130:
      return schema130();
    default:
      return schema130();
  }
};
export const schema110 = (): Schema => {
  const entities = [
    "financialsDailySnapshots",
    "usageMetricsDailySnapshots",
    "liquidityPoolDailySnapshots",
    "usageMetricsHourlySnapshots",
    "liquidityPoolHourlySnapshots",
  ];

  const entitiesData = {
    financialsDailySnapshots: {
      id: "Bytes!",
      days: "Int!",
      totalValueLockedUSD: "BigDecimal!",
      callsMintedCount: "Int!",
      closedPositionCount: "Int!",
      contractsClosedCount: "Int!",
      contractsExercisedCount: "Int!",
      contractsExpiredCount: "Int!",
      contractsTakenCount: "Int!",
      contractsMintedCount: "Int!",
      cumulativeClosedVolumeUSD: "BigDecimal!",
      cumulativeDepositPremiumUSD: "BigDecimal!",
      cumulativeEntryPremiumUSD: "BigDecimal!",
      cumulativeExercisedVolumeUSD: "BigDecimal!",
      cumulativeProtocolSideRevenueUSD: "BigDecimal!",
      cumulativeExitPremiumUSD: "BigDecimal!",
      cumulativeSupplySideRevenueUSD: "BigDecimal!",
      cumulativeTotalLiquidityPremiumUSD: "BigDecimal!",
      cumulativeTotalPremiumUSD: "BigDecimal!",
      cumulativeTotalRevenueUSD: "BigDecimal!",
      cumulativeVolumeUSD: "BigDecimal!",
      cumulativeWithdrawPremiumUSD: "BigDecimal!",
      dailyCallsMintedCount: "Int!",
      dailyClosedPositionCount: "Int!",
      dailyClosedVolumeUSD: "BigDecimal!",
      dailyContractsClosedCount: "Int!",
      dailyContractsExercisedCount: "Int!",
      dailyContractsExpiredCount: "Int!",
      dailyContractsMintedCount: "Int!",
      dailyContractsTakenCount: "Int!",
      dailyDepositPremiumUSD: "BigDecimal!",
      dailyEntryPremiumUSD: "BigDecimal!",
      dailyExercisedVolumeUSD: "BigDecimal!",
      dailyExitPremiumUSD: "BigDecimal!",
      dailyOpenInterestUSD: "BigDecimal!",
      dailyOpenPositionCount: "Int!",
      dailyProtocolSideRevenueUSD: "BigDecimal!",
      dailyPutsMintedCount: "Int!",
      dailySupplySideRevenueUSD: "BigDecimal!",
      dailyTotalLiquidityPremiumUSD: "BigDecimal!",
      dailyTotalPremiumUSD: "BigDecimal!",
      dailyTotalRevenueUSD: "BigDecimal!",
      dailyVolumeUSD: "BigDecimal!",
      dailyWithdrawPremiumUSD: "BigDecimal!",
      openPositionCount: "Int!",
      putsMintedCount: "Int!",
    },
    usageMetricsDailySnapshots: {
      id: "Bytes!",
      days: "Int!",
      cumulativeUniqueLP: "Int!",
      cumulativeUniqueTakers: "Int!",
      cumulativeUniqueUsers: "Int!",
      dailyActiveUsers: "Int!",
      dailyDepositCount: "Int!",
      dailySwapCount: "Int!",
      dailyTransactionCount: "Int!",
      dailyUniqueLP: "Int!",
      dailyUniqueTakers: "Int!",
      dailyWithdrawCount: "Int!",
      totalPoolCount: "Int!",
    },
    liquidityPoolDailySnapshots: {
      id: "Bytes!",
      days: "Int!",
      totalValueLockedUSD: "BigDecimal!",
      cumulativeSupplySideRevenueUSD: "BigDecimal!",
      dailySupplySideRevenueUSD: "BigDecimal!",
      cumulativeProtocolSideRevenueUSD: "BigDecimal!",
      dailyProtocolSideRevenueUSD: "BigDecimal!",
      cumulativeTotalRevenueUSD: "BigDecimal!",
      dailyTotalRevenueUSD: "BigDecimal!",
      dailyOpenInterestUSD: "Int!",
      dailyEntryPremiumUSD: "BigDecimal!",
      cumulativeEntryPremiumUSD: "BigDecimal!",
      dailyExitPremiumUSD: "BigDecimal!",
      cumulativeExitPremiumUSD: "BigDecimal!",
      dailyTotalPremiumUSD: "BigDecimal!",
      cumulativeTotalPremiumUSD: "BigDecimal!",
      dailyDepositPremiumUSD: "BigDecimal!",
      cumulativeDepositPremiumUSD: "BigDecimal!",
      dailyWithdrawPremiumUSD: "BigDecimal!",
      cumulativeWithdrawPremiumUSD: "BigDecimal!",
      dailyTotalLiquidityPremiumUSD: "BigDecimal!",
      cumulativeTotalLiquidityPremiumUSD: "BigDecimal!",
      dailyPutsMintedCount: "Int!",
      putsMintedCount: "Int!",
      dailyCallsMintedCount: "Int!",
      callsMintedCount: "Int!",
      dailyContractsMintedCount: "Int!",
      contractsMintedCount: "Int!",
      dailyContractsTakenCount: "Int!",
      contractsTakenCount: "Int!",
      dailyContractsExpiredCount: "Int!",
      contractsExpiredCount: "Int!",
      dailyContractsExercisedCount: "Int!",
      contractsExercisedCount: "Int!",
      dailyContractsClosedCount: "Int!",
      contractsClosedCount: "Int!",
      dailyOpenPositionCount: "Int!",
      openPositionCount: "Int!",
      dailyClosedPositionCount: "Int!",
      closedPositionCount: "Int!",
      dailyVolumeUSD: "BigDecimal!",
      dailyVolumeByTokenAmount: "[BigInt!]!",
      dailyVolumeByTokenUSD: "[BigDecimal!]!",
      cumulativeVolumeUSD: "BigDecimal!",
      dailyDepositedVolumeUSD: "BigDecimal!",
      dailyDepositedVolumeByTokenAmount: "[BigInt!]!",
      dailyDepositedVolumeByTokenUSD: "[BigDecimal!]!",
      cumulativeDepositedVolumeUSD: "BigDecimal!",
      dailyWithdrawVolumeUSD: "BigDecimal!",
      dailyWithdrawVolumeByTokenAmount: "[BigInt!]!",
      dailyWithdrawVolumeByTokenUSD: "[BigDecimal!]!",
      cumulativeWithdrawVolumeUSD: "BigDecimal!",
      dailyClosedVolumeUSD: "BigDecimal!",
      cumulativeClosedVolumeUSD: "BigDecimal!",
      dailyExerciseVolumeUSD: "BigDecimal!",
      cumulativeExerciseVolumeUSD: "BigDecimal!",
      inputTokenBalances: "[BigInt!]!",
      inputTokenWeights: "[BigDecimal!]!",
      outputTokenSupply: "BigInt",
      outputTokenPriceUSD: "BigDecimal",
      stakedOutputTokenAmount: "BigInt",
      rewardTokenEmissionsAmount: "[BigInt!]",
      rewardTokenEmissionsUSD: "[BigDecimal!]",
    },
    usageMetricsHourlySnapshots: {
      id: "Bytes!",
      hours: "Int!",
      cumulativeUniqueLP: "Int!",
      cumulativeUniqueTakers: "Int!",
      cumulativeUniqueUsers: "Int!",
      hourlyActiveUsers: "Int!",
      hourlyDepositCount: "Int!",
      hourlySwapCount: "Int!",
      hourlyTransactionCount: "Int!",
      hourlyWithdrawCount: "Int!",
    },
    liquidityPoolHourlySnapshots: {
      id: "Bytes!",
      hours: "Int!",
      totalValueLockedUSD: "BigDecimal!",
      cumulativeSupplySideRevenueUSD: "BigDecimal!",
      hourlySupplySideRevenueUSD: "BigDecimal!",
      cumulativeProtocolSideRevenueUSD: "BigDecimal!",
      hourlyProtocolSideRevenueUSD: "BigDecimal!",
      cumulativeTotalRevenueUSD: "BigDecimal!",
      hourlyTotalRevenueUSD: "BigDecimal!",
      hourlyOpenInterestUSD: "Int!",
      hourlyEntryPremiumUSD: "BigDecimal!",
      cumulativeEntryPremiumUSD: "BigDecimal!",
      hourlyExitPremiumUSD: "BigDecimal!",
      cumulativeExitPremiumUSD: "BigDecimal!",
      hourlyTotalPremiumUSD: "BigDecimal!",
      cumulativeTotalPremiumUSD: "BigDecimal!",
      hourlyDepositPremiumUSD: "BigDecimal!",
      cumulativeDepositPremiumUSD: "BigDecimal!",
      hourlyWithdrawPremiumUSD: "BigDecimal!",
      cumulativeWithdrawPremiumUSD: "BigDecimal!",
      hourlyTotalLiquidityPremiumUSD: "BigDecimal!",
      cumulativeTotalLiquidityPremiumUSD: "BigDecimal!",
      hourlyVolumeUSD: "BigDecimal!",
      hourlyVolumeByTokenAmount: "[BigInt!]!",
      hourlyVolumeByTokenUSD: "[BigDecimal!]!",
      cumulativeVolumeUSD: "BigDecimal!",
      hourlyDepositVolumeUSD: "BigDecimal!",
      hourlyDepositVolumeByTokenAmount: "[BigInt!]!",
      hourlyDepositVolumeByTokenUSD: "[BigDecimal!]!",
      cumulativeDepositVolumeUSD: "BigDecimal!",
      hourlyWithdrawVolumeUSD: "BigDecimal!",
      hourlyWithdrawVolumeByTokenAmount: "[BigInt!]!",
      hourlyWithdrawVolumeByTokenUSD: "[BigDecimal!]!",
      cumulativeWithdrawVolumeUSD: "BigDecimal!",
      inputTokenBalances: "[BigInt!]!",
      inputTokenWeights: "[BigDecimal!]!",
      outputTokenSupply: "BigInt",
      outputTokenPriceUSD: "BigDecimal",
      stakedOutputTokenAmount: "BigInt",
      rewardTokenEmissionsAmount: "[BigInt!]",
      rewardTokenEmissionsUSD: "[BigDecimal!]",
    },
  };

  const finanQuery =
    "financialsDailySnapshots(first: 1000, orderBy: days, orderDirection: desc) {" +
    Object.keys(entitiesData.financialsDailySnapshots).join(",") +
    "}";
  const usageDailyQuery =
    "usageMetricsDailySnapshots(first: 1000, orderBy: days, orderDirection: desc) {" +
    Object.keys(entitiesData.usageMetricsDailySnapshots).join(",") +
    "}";
  const usageHourlyQuery =
    "usageMetricsHourlySnapshots(first: 1000, orderBy: hours, orderDirection: desc) {" +
    Object.keys(entitiesData.usageMetricsHourlySnapshots).join(",") +
    "}";

  const liquidityPoolDailyQuery =
    "liquidityPoolDailySnapshots(first: 1000, orderBy: days, orderDirection: desc, where: {pool: $poolId}) {" +
    Object.keys(entitiesData.liquidityPoolDailySnapshots).join(",") +
    "}";
  const liquidityPoolHourlyQuery =
    "liquidityPoolHourlySnapshots(first: 1000, orderBy: hours, orderDirection: desc, where: {pool: $poolId}) {" +
    Object.keys(entitiesData.liquidityPoolHourlySnapshots).join(",") +
    "}";

  const protocolFields = {
    id: "Bytes!",
    name: "String!",
    slug: "String!",
    schemaVersion: "String!",
    subgraphVersion: "String!",
    methodologyVersion: "String!",
    network: "Network!",
    type: "ProtocolType!",
    totalValueLockedUSD: "BigDecimal!",
    cumulativeVolumeUSD: "BigDecimal!",
    cumulativeExercisedVolumeUSD: "BigDecimal!",
    cumulativeClosedVolumeUSD: "BigDecimal!",
    cumulativeSupplySideRevenueUSD: "BigDecimal!",
    cumulativeProtocolSideRevenueUSD: "BigDecimal!",
    cumulativeTotalRevenueUSD: "BigDecimal!",
    cumulativeEntryPremiumUSD: "BigDecimal!",
    cumulativeExitPremiumUSD: "BigDecimal!",
    cumulativeTotalPremiumUSD: "BigDecimal!",
    cumulativeDepositPremiumUSD: "BigDecimal!",
    cumulativeWithdrawPremiumUSD: "BigDecimal!",
    cumulativeTotalLiquidityPremiumUSD: "BigDecimal!",
    putsMintedCount: "Int!",
    callsMintedCount: "Int!",
    contractsMintedCount: "Int!",
    contractsTakenCount: "Int!",
    contractsExpiredCount: "Int!",
    contractsExercisedCount: "Int!",
    contractsClosedCount: "Int!",
    openPositionCount: "Int!",
    closedPositionCount: "Int!",
    cumulativeUniqueUsers: "Int!",
    cumulativeUniqueLP: "Int!",
    cumulativeUniqueTakers: "Int!",
    totalPoolCount: "Int!",
  };

  const protocolQueryFields = Object.keys(protocolFields).map((x) => x + "\n");

  // Query pool(pool) entity and events entities
  const events: string[] = ["deposits", "withdraws"];
  const eventsFields: string[] = ["hash", "to", "from", "blockNumber", "amountUSD", "outputTokenAmount"];
  const eventsQuery: any[] = events.map((event) => {
    let fields = eventsFields.join(", ");
    const baseStr = event + "(first: 1000, orderBy: timestamp, orderDirection: desc, where: {pool: $poolId}) { ";
    return baseStr + fields + " }";
  });

  const financialsQuery = `
  query Data {
    ${finanQuery}
  }`;
  const hourlyUsageQuery = `
  query Data {
    ${usageHourlyQuery}
  }`;
  const dailyUsageQuery = `
  query Data {
    ${usageDailyQuery}
  }`;

  const protocolTableQuery = `
  query Data($protocolId: String) {
    derivOptProtocol(id: $protocolId) {
      ${protocolQueryFields}
    }
  }`;

  const poolsQuery = `
    query Data {
      liquidityPools(first: 100, orderBy: totalValueLockedUSD, orderDirection: desc) {
        id
        name
      }
    }
  `;

  const poolTimeseriesQuery = `
    query Data($poolId: String) {
      ${liquidityPoolDailyQuery}
      ${liquidityPoolHourlyQuery}
    }
    `;

  const poolData: { [x: string]: string } = {
    id: "Bytes!",
    protocol: "DerivOptProtocol!",
    name: "String",
    symbol: "String",
    inputTokens: "[Token!]!",
    outputToken: "Token",
    rewardTokens: "[RewardToken!]",
    fees: "[LiquidityPoolFee!]!",
    oracle: "String",
    createdTimestamp: "BigInt!",
    createdBlockNumber: "BigInt!",
    totalValueLockedUSD: "BigDecimal!",
    cumulativeSupplySideRevenueUSD: "BigDecimal!",
    cumulativeProtocolSideRevenueUSD: "BigDecimal!",
    cumulativeTotalRevenueUSD: "BigDecimal!",
    cumulativeEntryPremiumUSD: "BigDecimal!",
    cumulativeExitPremiumUSD: "BigDecimal!",
    cumulativeTotalPremiumUSD: "BigDecimal!",
    cumulativeDepositPremiumUSD: "BigDecimal!",
    cumulativeWithdrawPremiumUSD: "BigDecimal!",
    cumulativeTotalLiquidityPremiumUSD: "BigDecimal!",
    cumulativeVolumeUSD: "BigDecimal!",
    cumulativeExercisedVolumeUSD: "BigDecimal!",
    cumulativeClosedVolumeUSD: "BigDecimal!",
    openInterestUSD: "Int!",
    putsMintedCount: "Int!",
    callsMintedCount: "Int!",
    contractsMintedCount: "Int!",
    contractsTakenCount: "Int!",
    contractsExpiredCount: "Int!",
    contractsExercisedCount: "Int!",
    contractsClosedCount: "Int!",
    openPositionCount: "Int!",
    closedPositionCount: "Int!",
    inputTokenBalances: "[BigInt!]!",
    inputTokenWeights: "[BigDecimal!]!",
    outputTokenSupply: "BigInt",
    outputTokenPriceUSD: "BigDecimal",
    stakedOutputTokenAmount: "BigInt",
    rewardTokenEmissionsAmount: "[BigInt!]",
    rewardTokenEmissionsUSD: "[BigDecimal!]",
  };

  let query = `
query Data($poolId: String, $protocolId: String){
  _meta {
    block {
      number
    }
    deployment
  }
  protocols {
    id
    methodologyVersion
    network
    name
    type
    slug
    schemaVersion
    subgraphVersion
  }
  derivOptProtocols {
    ${protocolQueryFields}
  }
  ${eventsQuery}
  liquidityPool(id: $poolId){
    id
    name
    symbol
    inputTokens{
      id
      decimals
      name
      symbol
    }
    outputToken {
      id
      decimals
      name
      symbol
    }
    rewardTokens {
      id
      type
      token {
        id
        decimals
        name
        symbol
      }
    }
    fees {
      id
      feePercentage
      feeType
    }
    oracle
    totalValueLockedUSD
    cumulativeSupplySideRevenueUSD
    cumulativeProtocolSideRevenueUSD
    cumulativeTotalRevenueUSD
    cumulativeEntryPremiumUSD
    cumulativeExitPremiumUSD
    cumulativeTotalPremiumUSD
    cumulativeDepositPremiumUSD
    cumulativeWithdrawPremiumUSD
    cumulativeTotalLiquidityPremiumUSD
    cumulativeVolumeUSD
    cumulativeExercisedVolumeUSD
    cumulativeClosedVolumeUSD
    openInterestUSD
    putsMintedCount
    callsMintedCount
    contractsMintedCount
    contractsTakenCount
    contractsExpiredCount
    contractsExercisedCount
    contractsClosedCount
    openPositionCount
    closedPositionCount
    inputTokenBalances
    inputTokenWeights
    outputTokenSupply
    outputTokenPriceUSD
    stakedOutputTokenAmount
    rewardTokenEmissionsAmount
    rewardTokenEmissionsUSD
  }
}`;

  return {
    entities,
    entitiesData,
    query,
    protocolTableQuery,
    poolData,
    events,
    protocolFields,
    poolsQuery,
    financialsQuery,
    hourlyUsageQuery,
    dailyUsageQuery,
    poolTimeseriesQuery,
  };
};

export const schema130 = (): Schema => {
  const entities = [
    "financialsDailySnapshots",
    "usageMetricsDailySnapshots",
    "liquidityPoolDailySnapshots",
    "usageMetricsHourlySnapshots",
    "liquidityPoolHourlySnapshots",
  ];

  const entitiesData = {
    financialsDailySnapshots: {
      id: "Bytes!",
      days: "Int!",
      totalValueLockedUSD: "BigDecimal!",
      dailyVolumeUSD: "BigDecimal!",
      cumulativeVolumeUSD: "BigDecimal!",
      dailyExercisedVolumeUSD: "BigDecimal!",
      cumulativeExercisedVolumeUSD: "BigDecimal!",
      dailyClosedVolumeUSD: "BigDecimal!",
      cumulativeClosedVolumeUSD: "BigDecimal!",
      openInterestUSD: "BigDecimal!",
      dailySupplySideRevenueUSD: "BigDecimal!",
      cumulativeSupplySideRevenueUSD: "BigDecimal!",
      dailyProtocolSideRevenueUSD: "BigDecimal!",
      cumulativeProtocolSideRevenueUSD: "BigDecimal!",
      dailyTotalRevenueUSD: "BigDecimal!",
      cumulativeTotalRevenueUSD: "BigDecimal!",
      dailyEntryPremiumUSD: "BigDecimal!",
      cumulativeEntryPremiumUSD: "BigDecimal!",
      dailyExitPremiumUSD: "BigDecimal!",
      cumulativeExitPremiumUSD: "BigDecimal!",
      dailyTotalPremiumUSD: "BigDecimal!",
      cumulativeTotalPremiumUSD: "BigDecimal!",
      dailyDepositPremiumUSD: "BigDecimal!",
      cumulativeDepositPremiumUSD: "BigDecimal!",
      dailyWithdrawPremiumUSD: "BigDecimal!",
      cumulativeWithdrawPremiumUSD: "BigDecimal!",
      dailyTotalLiquidityPremiumUSD: "BigDecimal!",
      cumulativeTotalLiquidityPremiumUSD: "BigDecimal!",
      dailyPutsMintedCount: "Int!",
      putsMintedCount: "Int!",
      dailyCallsMintedCount: "Int!",
      callsMintedCount: "Int!",
      dailyContractsMintedCount: "Int!",
      contractsMintedCount: "Int!",
      dailyContractsTakenCount: "Int!",
      contractsTakenCount: "Int!",
      dailyContractsExpiredCount: "Int!",
      contractsExpiredCount: "Int!",
      dailyContractsExercisedCount: "Int!",
      contractsExercisedCount: "Int!",
      dailyContractsClosedCount: "Int!",
      contractsClosedCount: "Int!",
      openPositionCount: "Int!",
      closedPositionCount: "Int!",
    },
    usageMetricsDailySnapshots: {
      id: "Bytes!",
      days: "Int!",
      dailyActiveUsers: "Int!",
      cumulativeUniqueUsers: "Int!",
      dailyUniqueLP: "Int!",
      cumulativeUniqueLP: "Int!",
      dailyUniqueTakers: "Int!",
      cumulativeUniqueTakers: "Int!",
      dailyTransactionCount: "Int!",
      dailyDepositCount: "Int!",
      dailyWithdrawCount: "Int!",
      dailySwapCount: "Int!",
      totalPoolCount: "Int!",
    },
    liquidityPoolDailySnapshots: {
      id: "Bytes!",
      days: "Int!",
      pool: "LiquidityPool!",
      totalValueLockedUSD: "BigDecimal!",
      cumulativeSupplySideRevenueUSD: "BigDecimal!",
      dailySupplySideRevenueUSD: "BigDecimal!",
      cumulativeProtocolSideRevenueUSD: "BigDecimal!",
      dailyProtocolSideRevenueUSD: "BigDecimal!",
      cumulativeTotalRevenueUSD: "BigDecimal!",
      dailyTotalRevenueUSD: "BigDecimal!",
      openInterestUSD: "BigDecimal!",
      dailyEntryPremiumUSD: "BigDecimal!",
      cumulativeEntryPremiumUSD: "BigDecimal!",
      dailyExitPremiumUSD: "BigDecimal!",
      cumulativeExitPremiumUSD: "BigDecimal!",
      dailyTotalPremiumUSD: "BigDecimal!",
      cumulativeTotalPremiumUSD: "BigDecimal!",
      dailyDepositPremiumUSD: "BigDecimal!",
      cumulativeDepositPremiumUSD: "BigDecimal!",
      dailyWithdrawPremiumUSD: "BigDecimal!",
      cumulativeWithdrawPremiumUSD: "BigDecimal!",
      dailyTotalLiquidityPremiumUSD: "BigDecimal!",
      cumulativeTotalLiquidityPremiumUSD: "BigDecimal!",
      dailyPutsMintedCount: "Int!",
      putsMintedCount: "Int!",
      dailyCallsMintedCount: "Int!",
      callsMintedCount: "Int!",
      dailyContractsMintedCount: "Int!",
      contractsMintedCount: "Int!",
      dailyContractsTakenCount: "Int!",
      contractsTakenCount: "Int!",
      dailyContractsExpiredCount: "Int!",
      contractsExpiredCount: "Int!",
      dailyContractsExercisedCount: "Int!",
      contractsExercisedCount: "Int!",
      dailyContractsClosedCount: "Int!",
      contractsClosedCount: "Int!",
      openPositionCount: "Int!",
      closedPositionCount: "Int!",
      dailyVolumeUSD: "BigDecimal!",
      dailyVolumeByTokenAmount: "[BigInt!]!",
      dailyVolumeByTokenUSD: "[BigDecimal!]!",
      cumulativeVolumeUSD: "BigDecimal!",
      cumulativeVolumeByTokenAmount: "[BigInt!]!",
      cumulativeVolumeByTokenUSD: "[BigDecimal!]!",
      dailyDepositedVolumeUSD: "BigDecimal!",
      dailyDepositedVolumeByTokenAmount: "[BigInt!]!",
      dailyDepositedVolumeByTokenUSD: "[BigDecimal!]!",
      cumulativeDepositedVolumeUSD: "BigDecimal!",
      cumulativeDepositedVolumeByTokenAmount: "[BigInt!]!",
      cumulativeDepositedVolumeByTokenUSD: "[BigDecimal!]!",
      dailyWithdrawVolumeUSD: "BigDecimal!",
      dailyWithdrawVolumeByTokenAmount: "[BigInt!]!",
      dailyWithdrawVolumeByTokenUSD: "[BigDecimal!]!",
      cumulativeWithdrawVolumeUSD: "BigDecimal!",
      cumulativeWithdrawVolumeByTokenAmount: "[BigInt!]!",
      cumulativeWithdrawVolumeByTokenUSD: "[BigDecimal!]!",
      dailyClosedVolumeUSD: "BigDecimal!",
      cumulativeClosedVolumeUSD: "BigDecimal!",
      dailyExerciseVolumeUSD: "BigDecimal!",
      cumulativeExerciseVolumeUSD: "BigDecimal!",
      inputTokenBalances: "[BigInt!]!",
      inputTokenWeights: "[BigDecimal!]!",
      outputTokenSupply: "BigInt",
      outputTokenPriceUSD: "BigDecimal",
      stakedOutputTokenAmount: "BigInt",
      rewardTokenEmissionsAmount: "[BigInt!]",
      rewardTokenEmissionsUSD: "[BigDecimal!]",
    },
    usageMetricsHourlySnapshots: {
      id: "Bytes!",
      hours: "Int!",
      hourlyActiveUsers: "Int!",
      cumulativeUniqueUsers: "Int!",
      cumulativeUniqueLP: "Int!",
      cumulativeUniqueTakers: "Int!",
      hourlyTransactionCount: "Int!",
      hourlyDepositCount: "Int!",
      hourlyWithdrawCount: "Int!",
      hourlySwapCount: "Int!",
    },
    liquidityPoolHourlySnapshots: {
      id: "Bytes!",
      hours: "Int!",
      totalValueLockedUSD: "BigDecimal!",
      cumulativeSupplySideRevenueUSD: "BigDecimal!",
      hourlySupplySideRevenueUSD: "BigDecimal!",
      cumulativeProtocolSideRevenueUSD: "BigDecimal!",
      hourlyProtocolSideRevenueUSD: "BigDecimal!",
      cumulativeTotalRevenueUSD: "BigDecimal!",
      hourlyTotalRevenueUSD: "BigDecimal!",
      openInterestUSD: "BigDecimal!",
      hourlyEntryPremiumUSD: "BigDecimal!",
      cumulativeEntryPremiumUSD: "BigDecimal!",
      hourlyExitPremiumUSD: "BigDecimal!",
      cumulativeExitPremiumUSD: "BigDecimal!",
      hourlyTotalPremiumUSD: "BigDecimal!",
      cumulativeTotalPremiumUSD: "BigDecimal!",
      hourlyDepositPremiumUSD: "BigDecimal!",
      cumulativeDepositPremiumUSD: "BigDecimal!",
      hourlyWithdrawPremiumUSD: "BigDecimal!",
      cumulativeWithdrawPremiumUSD: "BigDecimal!",
      hourlyTotalLiquidityPremiumUSD: "BigDecimal!",
      cumulativeTotalLiquidityPremiumUSD: "BigDecimal!",
      hourlyVolumeUSD: "BigDecimal!",
      hourlyVolumeByTokenAmount: "[BigInt!]!",
      hourlyVolumeByTokenUSD: "[BigDecimal!]!",
      cumulativeVolumeUSD: "BigDecimal!",
      cumulativeVolumeByTokenAmount: "[BigInt!]!",
      cumulativeVolumeByTokenUSD: "[BigDecimal!]!",
      hourlyDepositVolumeUSD: "BigDecimal!",
      hourlyDepositVolumeByTokenAmount: "[BigInt!]!",
      hourlyDepositVolumeByTokenUSD: "[BigDecimal!]!",
      cumulativeDepositVolumeUSD: "BigDecimal!",
      cumulativeDepositVolumeByTokenAmount: "[BigInt!]!",
      cumulativeDepositVolumeByTokenUSD: "[BigDecimal!]!",
      hourlyWithdrawVolumeUSD: "BigDecimal!",
      hourlyWithdrawVolumeByTokenAmount: "[BigInt!]!",
      hourlyWithdrawVolumeByTokenUSD: "[BigDecimal!]!",
      cumulativeWithdrawVolumeUSD: "BigDecimal!",
      cumulativeWithdrawVolumeByTokenAmount: "[BigInt!]!",
      cumulativeWithdrawVolumeByTokenUSD: "[BigDecimal!]!",
      inputTokenBalances: "[BigInt!]!",
      inputTokenWeights: "[BigDecimal!]!",
      outputTokenSupply: "BigInt",
      outputTokenPriceUSD: "BigDecimal",
      stakedOutputTokenAmount: "BigInt",
      rewardTokenEmissionsAmount: "[BigInt!]",
      rewardTokenEmissionsUSD: "[BigDecimal!]",
    },
  };

  const finanQuery =
    "financialsDailySnapshots(first: 1000, orderBy: days, orderDirection: desc) {" +
    Object.keys(entitiesData.financialsDailySnapshots).join(",") +
    "}";
  const usageDailyQuery =
    "usageMetricsDailySnapshots(first: 1000, orderBy: days, orderDirection: desc) {" +
    Object.keys(entitiesData.usageMetricsDailySnapshots).join(",") +
    "}";
  const usageHourlyQuery =
    "usageMetricsHourlySnapshots(first: 1000, orderBy: hours, orderDirection: desc) {" +
    Object.keys(entitiesData.usageMetricsHourlySnapshots).join(",") +
    "}";

  const liquidityPoolDailyQuery =
    "liquidityPoolDailySnapshots(first: 1000, orderBy: days, orderDirection: desc, where: {pool: $poolId}) {" +
    Object.keys(entitiesData.liquidityPoolDailySnapshots).join(",") +
    "}";
  const liquidityPoolHourlyQuery =
    "liquidityPoolHourlySnapshots(first: 1000, orderBy: hours, orderDirection: desc, where: {pool: $poolId}) {" +
    Object.keys(entitiesData.liquidityPoolHourlySnapshots).join(",") +
    "}";

  const protocolFields = {
    id: "Bytes!",
    name: "String!",
    slug: "String!",
    schemaVersion: "String!",
    subgraphVersion: "String!",
    methodologyVersion: "String!",
    network: "Network!",
    type: "ProtocolType!",
    totalValueLockedUSD: "BigDecimal!",
    cumulativeVolumeUSD: "BigDecimal!",
    cumulativeExercisedVolumeUSD: "BigDecimal!",
    cumulativeClosedVolumeUSD: "BigDecimal!",
    cumulativeSupplySideRevenueUSD: "BigDecimal!",
    cumulativeProtocolSideRevenueUSD: "BigDecimal!",
    cumulativeTotalRevenueUSD: "BigDecimal!",
    cumulativeEntryPremiumUSD: "BigDecimal!",
    cumulativeExitPremiumUSD: "BigDecimal!",
    cumulativeTotalPremiumUSD: "BigDecimal!",
    cumulativeDepositPremiumUSD: "BigDecimal!",
    cumulativeWithdrawPremiumUSD: "BigDecimal!",
    cumulativeTotalLiquidityPremiumUSD: "BigDecimal!",
    putsMintedCount: "Int!",
    callsMintedCount: "Int!",
    contractsMintedCount: "Int!",
    contractsTakenCount: "Int!",
    contractsExpiredCount: "Int!",
    contractsExercisedCount: "Int!",
    contractsClosedCount: "Int!",
    openInterestUSD: "BigDecimal!",
    openPositionCount: "Int!",
    closedPositionCount: "Int!",
    cumulativeUniqueUsers: "Int!",
    cumulativeUniqueLP: "Int!",
    cumulativeUniqueTakers: "Int!",
    totalPoolCount: "Int!",
  };

  const protocolQueryFields = Object.keys(protocolFields).map((x) => x + "\n");

  // Query pool(pool) entity and events entities
  const events: string[] = ["deposits", "withdraws"];
  const eventsFields: string[] = ["hash", "to", "from", "blockNumber", "amountUSD", "outputTokenAmount"];
  const eventsQuery: any[] = events.map((event) => {
    let fields = eventsFields.join(", ");
    const baseStr = event + "(first: 1000, orderBy: timestamp, orderDirection: desc, where: {pool: $poolId}) { ";
    return baseStr + fields + " }";
  });

  const financialsQuery = `
    query Data {
      ${finanQuery}
    }`;
  const hourlyUsageQuery = `
    query Data {
      ${usageHourlyQuery}
    }`;
  const dailyUsageQuery = `
    query Data {
      ${usageDailyQuery}
    }`;

  const protocolTableQuery = `
    query Data($protocolId: String) {
      derivOptProtocol(id: $protocolId) {
        ${protocolQueryFields}
      }
    }`;

  const poolsQuery = `
      query Data {
        liquidityPools(first: 100, orderBy: totalValueLockedUSD, orderDirection: desc) {
          id
          name
        }
      }
    `;

  const poolTimeseriesQuery = `
      query Data($poolId: String) {
        ${liquidityPoolDailyQuery}
        ${liquidityPoolHourlyQuery}
      }
      `;

  const poolData: { [x: string]: string } = {
    id: "Bytes!",
    protocol: "DerivOptProtocol!",
    name: "String",
    symbol: "String",
    inputTokens: "[Token!]!",
    outputToken: "Token",
    rewardTokens: "[RewardToken!]",
    fees: "[LiquidityPoolFee!]!",
    oracle: "String",
    createdTimestamp: "BigInt!",
    createdBlockNumber: "BigInt!",
    totalValueLockedUSD: "BigDecimal!",
    cumulativeSupplySideRevenueUSD: "BigDecimal!",
    cumulativeProtocolSideRevenueUSD: "BigDecimal!",
    cumulativeTotalRevenueUSD: "BigDecimal!",
    cumulativeEntryPremiumUSD: "BigDecimal!",
    cumulativeExitPremiumUSD: "BigDecimal!",
    cumulativeTotalPremiumUSD: "BigDecimal!",
    cumulativeDepositPremiumUSD: "BigDecimal!",
    cumulativeWithdrawPremiumUSD: "BigDecimal!",
    cumulativeTotalLiquidityPremiumUSD: "BigDecimal!",
    cumulativeVolumeUSD: "BigDecimal!",
    cumulativeDepositedVolumeUSD: "BigDecimal!",
    cumulativeWithdrawVolumeUSD: "BigDecimal!",
    cumulativeExercisedVolumeUSD: "BigDecimal!",
    cumulativeClosedVolumeUSD: "BigDecimal!",
    openInterestUSD: "BigDecimal!",
    putsMintedCount: "Int!",
    callsMintedCount: "Int!",
    contractsMintedCount: "Int!",
    contractsTakenCount: "Int!",
    contractsExpiredCount: "Int!",
    contractsExercisedCount: "Int!",
    contractsClosedCount: "Int!",
    openPositionCount: "Int!",
    closedPositionCount: "Int!",
    cumulativeVolumeByTokenAmount: "[BigInt!]!",
    cumulativeVolumeByTokenUSD: "[BigDecimal!]!",
    cumulativeDepositedVolumeByTokenAmount: "[BigInt!]!",
    cumulativeDepositedVolumeByTokenUSD: "[BigDecimal!]!",
    cumulativeWithdrawVolumeByTokenAmount: "[BigInt!]!",
    cumulativeWithdrawVolumeByTokenUSD: "[BigDecimal!]!",
    inputTokenBalances: "[BigInt!]!",
    inputTokenWeights: "[BigDecimal!]!",
    outputTokenSupply: "BigInt",
    outputTokenPriceUSD: "BigDecimal",
    stakedOutputTokenAmount: "BigInt",
    rewardTokenEmissionsAmount: "[BigInt!]",
    rewardTokenEmissionsUSD: "[BigDecimal!]",
  };

  let query = `
  query Data($poolId: String, $protocolId: String){
    _meta {
      block {
        number
      }
      deployment
    }
    protocols {
      id
      methodologyVersion
      network
      name
      type
      slug
      schemaVersion
      subgraphVersion
    }
    derivOptProtocols {
      ${protocolQueryFields}
    }
    ${eventsQuery}
    liquidityPool(id: $poolId){
      id
      name
      symbol

      inputTokens{
        id
        decimals
        name
        symbol
      }
      outputToken {
        id
        decimals
        name
        symbol
      }
      rewardTokens {
        id
        type
        token {
          id
          decimals
          name
          symbol
        }
      }
      fees {
        id
        feePercentage
        feeType
      }
      oracle
      totalValueLockedUSD
      cumulativeSupplySideRevenueUSD
      cumulativeProtocolSideRevenueUSD
      cumulativeTotalRevenueUSD
      cumulativeEntryPremiumUSD
      cumulativeExitPremiumUSD
      cumulativeTotalPremiumUSD
      cumulativeDepositPremiumUSD
      cumulativeWithdrawPremiumUSD
      cumulativeTotalLiquidityPremiumUSD
      cumulativeVolumeUSD
      cumulativeExercisedVolumeUSD
      cumulativeClosedVolumeUSD
      openInterestUSD
      putsMintedCount
      callsMintedCount
      contractsMintedCount
      contractsTakenCount
      contractsExpiredCount
      contractsExercisedCount
      contractsClosedCount
      openPositionCount
      closedPositionCount
      inputTokenBalances
      inputTokenWeights
      outputTokenSupply
      outputTokenPriceUSD
      stakedOutputTokenAmount
      rewardTokenEmissionsAmount
      rewardTokenEmissionsUSD
    }
  }`;

  return {
    entities,
    entitiesData,
    query,
    protocolTableQuery,
    poolData,
    events,
    protocolFields,
    poolsQuery,
    financialsQuery,
    hourlyUsageQuery,
    dailyUsageQuery,
    poolTimeseriesQuery,
  };
};
