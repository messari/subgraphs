import { Schema, Versions } from "../../constants";

export const versionsList = ["1.0.0", "1.1.0"];

export const schema = (version: string): Schema => {
  // The version group uses the first two digits  of the schema version and defaults to that schema.
  const versionGroupArr = version.split(".");
  versionGroupArr.pop();
  const versionGroup = versionGroupArr.join(".") + ".0";
  switch (versionGroup) {
    case Versions.Schema100:
      return schema100();
    case Versions.Schema110:
      return schema110();
    default:
      return schema110();
  }
};

export const schema100 = (): Schema => {
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
      protocolControlledValueUSD: "BigDecimal",
      dailyVolumeUSD: "BigDecimal!",
      cumulativeVolumeUSD: "BigDecimal!",
      dailyInflowVolumeUSD: "BigDecimal!",
      cumulativeInflowVolumeUSD: "BigDecimal!",
      dailyClosedInflowVolumeUSD: "BigDecimal!",
      cumulativeClosedInflowVolumeUSD: "BigDecimal!",
      dailyOutflowVolumeUSD: "BigDecimal!",
      cumulativeOutflowVolumeUSD: "BigDecimal!",
      dailyOpenInterestUSD: "BigDecimal!",
      dailySupplySideRevenueUSD: "BigDecimal!",
      cumulativeSupplySideRevenueUSD: "BigDecimal!",
      dailyProtocolSideRevenueUSD: "BigDecimal!",
      cumulativeProtocolSideRevenueUSD: "BigDecimal!",
      dailyStakeSideRevenueUSD: "BigDecimal!",
      cumulativeStakeSideRevenueUSD: "BigDecimal!",
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
      cumulativeTotalLiquidityPremiumUSD: "BigDecimal!"
    },
    usageMetricsDailySnapshots: {
      id: "Bytes!",
      days: "Int!",
      dailyActiveUsers: "Int!",
      cumulativeUniqueUsers: "Int!",
      dailylongPositionCount: "Int!",
      longPositionCount: "Int!",
      dailyshortPositionCount: "Int!",
      shortPositionCount: "Int!",
      dailyopenPositionCount: "Int!",
      openPositionCount: "Int!",
      dailyclosedPositionCount: "Int!",
      closedPositionCount: "Int!",
      dailycumulativePositionCount: "Int!",
      cumulativePositionCount: "Int!",
      dailyTransactionCount: "Int!",
      dailyDepositCount: "Int!",
      dailyWithdrawCount: "Int!",
      dailyBorrowCount: "Int!",
      dailySwapCount: "Int!",
      dailyActiveDepositors: "Int!",
      cumulativeUniqueDepositors: "Int!",
      dailyActiveBorrowers: "Int!",
      cumulativeUniqueBorrowers: "Int!",
      dailyActiveLiquidators: "Int!",
      cumulativeUniqueLiquidators: "Int!",
      dailyActiveLiquidatees: "Int!",
      cumulativeUniqueLiquidatees: "Int!",
      dailyCollateralIn: "Int!",
      cumulativeCollateralIn: "Int!",
      dailyCollateralOut: "Int!",
      cumulativeCollateralOut: "Int!",
      totalPoolCount: "Int!"
    },
    liquidityPoolDailySnapshots: {
      id: "Bytes!",
      days: "Int!",
      totalValueLockedUSD: "BigDecimal!",
      cumulativeSupplySideRevenueUSD: "BigDecimal!",
      dailySupplySideRevenueUSD: "BigDecimal!",
      cumulativeProtocolSideRevenueUSD: "BigDecimal!",
      dailyProtocolSideRevenueUSD: "BigDecimal!",
      dailyTotalRevenueUSD: "BigDecimal!",
      cumulativeTotalRevenueUSD: "BigDecimal!",
      dailyFundingrate: "[BigDecimal!]!",
      dailyOpenInterestUSD: "BigDecimal!",
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
      dailyActiveBorrowers: "Int!",
      cumulativeUniqueBorrowers: "Int!",
      dailyActiveLiquidators: "Int!",
      cumulativeUniqueLiquidators: "Int!",
      dailyActiveLiquidatees: "Int!",
      cumulativeUniqueLiquidatees: "Int!",
      dailylongPositionCount: "Int!",
      longPositionCount: "Int!",
      dailyshortPositionCount: "Int!",
      shortPositionCount: "Int!",
      dailyopenPositionCount: "Int!",
      openPositionCount: "Int!",
      dailyclosedPositionCount: "Int!",
      closedPositionCount: "Int!",
      dailycumulativePositionCount: "Int!",
      cumulativePositionCount: "Int!",
      dailyVolumeUSD: "BigDecimal!",
      dailyVolumeByTokenAmount: "[BigInt!]!",
      dailyVolumeByTokenUSD: "[BigDecimal!]!",
      cumulativeVolumeUSD: "BigDecimal!",
      dailyInflowVolumeUSD: "BigDecimal!",
      dailyInflowVolumeByTokenAmount: "[BigInt!]!",
      dailyInflowVolumeByTokenUSD: "[BigDecimal!]!",
      cumulativeInflowVolumeUSD: "BigDecimal!",
      dailyClosedInflowVolumeUSD: "BigDecimal!",
      dailyClosedInflowVolumeByTokenAmount: "[BigInt!]!",
      dailyClosedInflowVolumeByTokenUSD: "[BigDecimal!]!",
      cumulativeClosedInflowVolumeUSD: "BigDecimal!",
      dailyOutflowVolumeUSD: "BigDecimal!",
      dailyOutflowVolumeByTokenAmount: "[BigInt!]!",
      dailyOutflowVolumeByTokenUSD: "[BigDecimal!]!",
      cumulativeOutflowVolumeUSD: "BigDecimal!",
      inputTokenBalances: "[BigInt!]!",
      inputTokenWeights: "[BigDecimal!]!",
      outputTokenSupply: "BigInt",
      outputTokenPriceUSD: "BigDecimal",
      stakedOutputTokenAmount: "BigInt",
      rewardTokenEmissionsAmount: "[BigInt!]",
      rewardTokenEmissionsUSD: "[BigDecimal!]"
    },
    usageMetricsHourlySnapshots: {
      id: "Bytes!",
      hours: "Int!",
      hourlyActiveUsers: "Int!",
      cumulativeUniqueUsers: "Int!",
      hourlyTransactionCount: "Int!",
      hourlyDepositCount: "Int!",
      hourlyWithdrawCount: "Int!",
      hourlySwapCount: "Int!"
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
      hourlyFundingrate: "[BigDecimal!]!",
      hourlyOpenInterestUSD: "BigDecimal!",
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
      hourlyInflowVolumeUSD: "BigDecimal!",
      hourlyInflowVolumeByTokenAmount: "[BigInt!]!",
      hourlyInflowVolumeByTokenUSD: "[BigDecimal!]!",
      cumulativeInflowVolumeUSD: "BigDecimal!",
      hourlyClosedInflowVolumeUSD: "BigDecimal!",
      hourlyClosedInflowVolumeByTokenAmount: "[BigInt!]!",
      hourlyClosedInflowVolumeByTokenUSD: "[BigDecimal!]!",
      cumulativeClosedInflowVolumeUSD: "BigDecimal!",
      hourlyOutflowVolumeUSD: "BigDecimal!",
      hourlyOutflowVolumeByTokenAmount: "[BigInt!]!",
      hourlyOutflowVolumeByTokenUSD: "[BigDecimal!]!",
      cumulativeOutflowVolumeUSD: "BigDecimal!",
      inputTokenBalances: "[BigInt!]!",
      inputTokenWeights: "[BigDecimal!]!",
      outputTokenSupply: "BigInt",
      outputTokenPriceUSD: "BigDecimal",
      stakedOutputTokenAmount: "BigInt",
      rewardTokenEmissionsAmount: "[BigInt!]",
      rewardTokenEmissionsUSD: "[BigDecimal!]"
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
    protocolControlledValueUSD: "BigDecimal",
    cumulativeVolumeUSD: "BigDecimal!",
    cumulativeSupplySideRevenueUSD: "BigDecimal!",
    cumulativeProtocolSideRevenueUSD: "BigDecimal!",
    cumulativeStakeSideRevenueUSD: "BigDecimal!",
    cumulativeTotalRevenueUSD: "BigDecimal!",
    cumulativeEntryPremiumUSD: "BigDecimal!",
    cumulativeExitPremiumUSD: "BigDecimal!",
    cumulativeTotalPremiumUSD: "BigDecimal!",
    cumulativeDepositPremiumUSD: "BigDecimal!",
    cumulativeWithdrawPremiumUSD: "BigDecimal!",
    cumulativeTotalLiquidityPremiumUSD: "BigDecimal!",
    cumulativeUniqueUsers: "Int!",
    cumulativeUniqueBorrowers: "Int!",
    cumulativeUniqueLiquidators: "Int!",
    cumulativeUniqueLiquidatees: "Int!",
    openInterestUSD: "BigDecimal!",
    longPositionCount: "Int!",
    shortPositionCount: "Int!",
    openPositionCount: "Int!",
    closedPositionCount: "Int!",
    cumulativePositionCount: "Int!",
    transactionCount: "Int!",
    depositCount: "Int!",
    withdrawCount: "Int!",
    borrowCount: "Int!",
    collateralInCount: "Int!",
    collateralOutCount: "Int!",
    totalPoolCount: "Int!"
  };

  const protocolQueryFields = Object.keys(protocolFields).map(x => x + '\n');

  // Query pool(pool) entity and events entities
  const events: string[] = ["deposits", "withdraws", "collateralIns", "collateralOuts", "swaps", "liquidates"];
  const eventsFields: string[] = ["hash", "to", "from", "blockNumber"]
  const eventsQuery: any[] = events.map((event) => {
    let fields = eventsFields.join(", ");
    if (event === "deposits" || event === "withdraws" || event === "collateralIns" || event === "collateralOuts") {
      fields += ', amountUSD';
    } else if (event === "swaps") {
      fields += ", amountIn, amountInUSD, amountOut, amountOutUSD";
    } else if (event === "liquidates") {
      fields += ", liquidator{id}, liquidatee{id}, amount, amountUSD, profitUSD";
    }
    const baseStr =
      event + "(first: 1000, orderBy: timestamp, orderDirection: desc, where: {pool: $poolId}) { ";
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
      derivPerpProtocol(id: $protocolId) {
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
    name: "String",
    symbol: "String",
    inputTokens: "[Token!]!",
    outputToken: "Token",
    rewardTokens: "[RewardToken!]",
    fees: "[LiquidityPoolFee!]!",
    oracle: "String",
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
    cumulativeUniqueBorrowers: "Int!",
    cumulativeUniqueLiquidators: "Int!",
    cumulativeUniqueLiquidatees: "Int!",
    openInterestUSD: "BigDecimal!",
    longPositionCount: "Int!",
    shortPositionCount: "Int!",
    openPositionCount: "Int!",
    closedPositionCount: "Int!",
    cumulativePositionCount: "Int!",
    cumulativeVolumeUSD: "BigDecimal!",
    inputTokenBalances: "[BigInt!]!",
    inputTokenWeights: "[BigDecimal!]!",
    outputTokenSupply: "BigInt",
    outputTokenPriceUSD: "BigDecimal",
    stakedOutputTokenAmount: "BigInt",
    rewardTokenEmissionsAmount: "[BigInt!]",
    rewardTokenEmissionsUSD: "[BigDecimal!]"
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
    derivPerpProtocols {
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
      cumulativeUniqueBorrowers
      cumulativeUniqueLiquidators
      cumulativeUniqueLiquidatees
      openInterestUSD
      longPositionCount
      shortPositionCount
      openPositionCount
      closedPositionCount
      cumulativePositionCount
      cumulativeVolumeUSD
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
      protocolControlledValueUSD: "BigDecimal",
      dailyVolumeUSD: "BigDecimal!",
      cumulativeVolumeUSD: "BigDecimal!",
      dailyInflowVolumeUSD: "BigDecimal!",
      cumulativeInflowVolumeUSD: "BigDecimal!",
      dailyClosedInflowVolumeUSD: "BigDecimal!",
      cumulativeClosedInflowVolumeUSD: "BigDecimal!",
      dailyOutflowVolumeUSD: "BigDecimal!",
      cumulativeOutflowVolumeUSD: "BigDecimal!",
      dailyOpenInterestUSD: "BigDecimal!",
      dailySupplySideRevenueUSD: "BigDecimal!",
      cumulativeSupplySideRevenueUSD: "BigDecimal!",
      dailyProtocolSideRevenueUSD: "BigDecimal!",
      cumulativeProtocolSideRevenueUSD: "BigDecimal!",
      dailyStakeSideRevenueUSD: "BigDecimal!",
      cumulativeStakeSideRevenueUSD: "BigDecimal!",
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
      cumulativeTotalLiquidityPremiumUSD: "BigDecimal!"
    },
    usageMetricsDailySnapshots: {
      id: "Bytes!",
      days: "Int!",
      dailyActiveUsers: "Int!",
      cumulativeUniqueUsers: "Int!",
      dailyLongPositionCount: "Int!",
      longPositionCount: "Int!",
      dailyShortPositionCount: "Int!",
      shortPositionCount: "Int!",
      dailyOpenPositionCount: "Int!",
      openPositionCount: "Int!",
      dailyClosedPositionCount: "Int!",
      closedPositionCount: "Int!",
      dailyCumulativePositionCount: "Int!",
      cumulativePositionCount: "Int!",
      dailyTransactionCount: "Int!",
      dailyDepositCount: "Int!",
      dailyWithdrawCount: "Int!",
      dailyBorrowCount: "Int!",
      dailySwapCount: "Int!",
      dailyActiveDepositors: "Int!",
      cumulativeUniqueDepositors: "Int!",
      dailyActiveBorrowers: "Int!",
      cumulativeUniqueBorrowers: "Int!",
      dailyActiveLiquidators: "Int!",
      cumulativeUniqueLiquidators: "Int!",
      dailyActiveLiquidatees: "Int!",
      cumulativeUniqueLiquidatees: "Int!",
      dailyCollateralIn: "Int!",
      cumulativeCollateralIn: "Int!",
      dailyCollateralOut: "Int!",
      cumulativeCollateralOut: "Int!",
      totalPoolCount: "Int!"
    },
    liquidityPoolDailySnapshots: {
      id: "Bytes!",
      days: "Int!",
      totalValueLockedUSD: "BigDecimal!",
      cumulativeSupplySideRevenueUSD: "BigDecimal!",
      dailySupplySideRevenueUSD: "BigDecimal!",
      cumulativeProtocolSideRevenueUSD: "BigDecimal!",
      dailyProtocolSideRevenueUSD: "BigDecimal!",
      dailyTotalRevenueUSD: "BigDecimal!",
      cumulativeTotalRevenueUSD: "BigDecimal!",
      dailyFundingrate: "[BigDecimal!]!",
      dailyOpenInterestUSD: "BigDecimal!",
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
      dailyActiveBorrowers: "Int!",
      cumulativeUniqueBorrowers: "Int!",
      dailyActiveLiquidators: "Int!",
      cumulativeUniqueLiquidators: "Int!",
      dailyActiveLiquidatees: "Int!",
      cumulativeUniqueLiquidatees: "Int!",
      dailyLongPositionCount: "Int!",
      longPositionCount: "Int!",
      dailyShortPositionCount: "Int!",
      shortPositionCount: "Int!",
      dailyOpenPositionCount: "Int!",
      openPositionCount: "Int!",
      dailyClosedPositionCount: "Int!",
      closedPositionCount: "Int!",
      dailyCumulativePositionCount: "Int!",
      cumulativePositionCount: "Int!",
      dailyVolumeUSD: "BigDecimal!",
      dailyVolumeByTokenAmount: "[BigInt!]!",
      dailyVolumeByTokenUSD: "[BigDecimal!]!",
      cumulativeVolumeUSD: "BigDecimal!",
      dailyInflowVolumeUSD: "BigDecimal!",
      dailyInflowVolumeByTokenAmount: "[BigInt!]!",
      dailyInflowVolumeByTokenUSD: "[BigDecimal!]!",
      cumulativeInflowVolumeUSD: "BigDecimal!",
      dailyClosedInflowVolumeUSD: "BigDecimal!",
      dailyClosedInflowVolumeByTokenAmount: "[BigInt!]!",
      dailyClosedInflowVolumeByTokenUSD: "[BigDecimal!]!",
      cumulativeClosedInflowVolumeUSD: "BigDecimal!",
      dailyOutflowVolumeUSD: "BigDecimal!",
      dailyOutflowVolumeByTokenAmount: "[BigInt!]!",
      dailyOutflowVolumeByTokenUSD: "[BigDecimal!]!",
      cumulativeOutflowVolumeUSD: "BigDecimal!",
      inputTokenBalances: "[BigInt!]!",
      inputTokenWeights: "[BigDecimal!]!",
      outputTokenSupply: "BigInt",
      outputTokenPriceUSD: "BigDecimal",
      stakedOutputTokenAmount: "BigInt",
      rewardTokenEmissionsAmount: "[BigInt!]",
      rewardTokenEmissionsUSD: "[BigDecimal!]"
    },
    usageMetricsHourlySnapshots: {
      id: "Bytes!",
      hours: "Int!",
      hourlyActiveUsers: "Int!",
      cumulativeUniqueUsers: "Int!",
      hourlyTransactionCount: "Int!",
      hourlyDepositCount: "Int!",
      hourlyWithdrawCount: "Int!",
      hourlySwapCount: "Int!"
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
      hourlyFundingrate: "[BigDecimal!]!",
      hourlyOpenInterestUSD: "BigDecimal!",
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
      hourlyInflowVolumeUSD: "BigDecimal!",
      hourlyInflowVolumeByTokenAmount: "[BigInt!]!",
      hourlyInflowVolumeByTokenUSD: "[BigDecimal!]!",
      cumulativeInflowVolumeUSD: "BigDecimal!",
      hourlyClosedInflowVolumeUSD: "BigDecimal!",
      hourlyClosedInflowVolumeByTokenAmount: "[BigInt!]!",
      hourlyClosedInflowVolumeByTokenUSD: "[BigDecimal!]!",
      cumulativeClosedInflowVolumeUSD: "BigDecimal!",
      hourlyOutflowVolumeUSD: "BigDecimal!",
      hourlyOutflowVolumeByTokenAmount: "[BigInt!]!",
      hourlyOutflowVolumeByTokenUSD: "[BigDecimal!]!",
      cumulativeOutflowVolumeUSD: "BigDecimal!",
      inputTokenBalances: "[BigInt!]!",
      inputTokenWeights: "[BigDecimal!]!",
      outputTokenSupply: "BigInt",
      outputTokenPriceUSD: "BigDecimal",
      stakedOutputTokenAmount: "BigInt",
      rewardTokenEmissionsAmount: "[BigInt!]",
      rewardTokenEmissionsUSD: "[BigDecimal!]"
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
    protocolControlledValueUSD: "BigDecimal",
    cumulativeVolumeUSD: "BigDecimal!",
    cumulativeSupplySideRevenueUSD: "BigDecimal!",
    cumulativeProtocolSideRevenueUSD: "BigDecimal!",
    cumulativeStakeSideRevenueUSD: "BigDecimal!",
    cumulativeTotalRevenueUSD: "BigDecimal!",
    cumulativeEntryPremiumUSD: "BigDecimal!",
    cumulativeExitPremiumUSD: "BigDecimal!",
    cumulativeTotalPremiumUSD: "BigDecimal!",
    cumulativeDepositPremiumUSD: "BigDecimal!",
    cumulativeWithdrawPremiumUSD: "BigDecimal!",
    cumulativeTotalLiquidityPremiumUSD: "BigDecimal!",
    cumulativeUniqueUsers: "Int!",
    cumulativeUniqueBorrowers: "Int!",
    cumulativeUniqueLiquidators: "Int!",
    cumulativeUniqueLiquidatees: "Int!",
    openInterestUSD: "BigDecimal!",
    longPositionCount: "Int!",
    shortPositionCount: "Int!",
    openPositionCount: "Int!",
    closedPositionCount: "Int!",
    cumulativePositionCount: "Int!",
    transactionCount: "Int!",
    depositCount: "Int!",
    withdrawCount: "Int!",
    borrowCount: "Int!",
    collateralInCount: "Int!",
    collateralOutCount: "Int!",
    totalPoolCount: "Int!"
  };

  const protocolQueryFields = Object.keys(protocolFields).map(x => x + '\n');

  // Query pool(pool) entity and events entities
  const events: string[] = ["deposits", "withdraws", "collateralIns", "collateralOuts", "swaps", "liquidates"];
  const eventsFields: string[] = ["hash", "to", "from", "blockNumber"]
  const eventsQuery: any[] = events.map((event) => {
    let fields = eventsFields.join(", ");
    if (event === "deposits" || event === "withdraws" || event === "collateralIns" || event === "collateralOuts") {
      fields += ', amountUSD';
    } else if (event === "swaps") {
      fields += ", amountIn, amountInUSD, amountOut, amountOutUSD";
    } else if (event === "liquidates") {
      fields += ", liquidator{id}, liquidatee{id}, amount, amountUSD, profitUSD";
    }
    const baseStr =
      event + "(first: 1000, orderBy: timestamp, orderDirection: desc, where: {pool: $poolId}) { ";
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
      derivPerpProtocol(id: $protocolId) {
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
    name: "String",
    symbol: "String",
    inputTokens: "[Token!]!",
    outputToken: "Token",
    rewardTokens: "[RewardToken!]",
    fees: "[LiquidityPoolFee!]!",
    oracle: "String",
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
    cumulativeUniqueBorrowers: "Int!",
    cumulativeUniqueLiquidators: "Int!",
    cumulativeUniqueLiquidatees: "Int!",
    openInterestUSD: "BigDecimal!",
    longPositionCount: "Int!",
    shortPositionCount: "Int!",
    openPositionCount: "Int!",
    closedPositionCount: "Int!",
    cumulativePositionCount: "Int!",
    cumulativeVolumeUSD: "BigDecimal!",
    inputTokenBalances: "[BigInt!]!",
    inputTokenWeights: "[BigDecimal!]!",
    outputTokenSupply: "BigInt",
    outputTokenPriceUSD: "BigDecimal",
    stakedOutputTokenAmount: "BigInt",
    rewardTokenEmissionsAmount: "[BigInt!]",
    rewardTokenEmissionsUSD: "[BigDecimal!]"
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
    derivPerpProtocols {
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
      cumulativeUniqueBorrowers
      cumulativeUniqueLiquidators
      cumulativeUniqueLiquidatees
      openInterestUSD
      longPositionCount
      shortPositionCount
      openPositionCount
      closedPositionCount
      cumulativePositionCount
      cumulativeVolumeUSD
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
