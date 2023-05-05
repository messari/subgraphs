import { Schema, Versions } from "../../constants";

export const versionsList = ["1.3.0", "2.0.0", "3.0.3"];

export const schema = (version: string): Schema => {
  // The version group uses the first two digits  of the schema version and defaults to that schema.
  const versionGroupArr = version.split(".");
  const spec = versionGroupArr.pop();
  const versionGroup = versionGroupArr.join(".") + ".0";
  switch (versionGroup) {
    case Versions.Schema130:
      return schema130();
    case Versions.Schema200:
      return schema200();
    case Versions.Schema300:
      return schema303();
    default:
      return schema130();
  }
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
      id: "ID!",
      totalValueLockedUSD: "BigDecimal!",
      dailyVolumeUSD: "BigDecimal!",
      cumulativeVolumeUSD: "BigDecimal!",
      dailySupplySideRevenueUSD: "BigDecimal!",
      cumulativeSupplySideRevenueUSD: "BigDecimal!",
      dailyProtocolSideRevenueUSD: "BigDecimal!",
      cumulativeProtocolSideRevenueUSD: "BigDecimal!",
      dailyTotalRevenueUSD: "BigDecimal!",
      cumulativeTotalRevenueUSD: "BigDecimal!",
      timestamp: "BigInt!",
    },
    usageMetricsDailySnapshots: {
      id: "ID!",
      cumulativeUniqueUsers: "Int!",
      dailyActiveUsers: "Int!",
      dailyTransactionCount: "Int!",
      dailyDepositCount: "Int!",
      dailyWithdrawCount: "Int!",
      dailySwapCount: "Int!",
      timestamp: "BigInt!",
      totalPoolCount: "Int!",
    },
    liquidityPoolDailySnapshots: {
      id: "ID!",
      totalValueLockedUSD: "BigDecimal!",
      cumulativeSupplySideRevenueUSD: "BigDecimal!",
      dailySupplySideRevenueUSD: "BigDecimal!",
      cumulativeProtocolSideRevenueUSD: "BigDecimal!",
      dailyProtocolSideRevenueUSD: "BigDecimal!",
      cumulativeTotalRevenueUSD: "BigDecimal!",
      dailyTotalRevenueUSD: "BigDecimal!",
      dailyVolumeUSD: "BigDecimal!",
      dailyVolumeByTokenAmount: "[BigInt!]!",
      dailyVolumeByTokenUSD: "[BigDecimal!]!",
      cumulativeVolumeUSD: "BigDecimal!",
      inputTokenBalances: "[BigInt!]!",
      inputTokenWeights: "[BigDecimal!]!",
      outputTokenSupply: "BigInt",
      outputTokenPriceUSD: "BigDecimal",
      stakedOutputTokenAmount: "BigInt",
      rewardTokenEmissionsAmount: "[BigInt!]",
      rewardTokenEmissionsUSD: "[BigDecimal!]",
      timestamp: "BigInt!",
    },
    usageMetricsHourlySnapshots: {
      id: "ID!",
      cumulativeUniqueUsers: "Int!",
      hourlyActiveUsers: "Int!",
      hourlyTransactionCount: "Int!",
      hourlyDepositCount: "Int!",
      hourlyWithdrawCount: "Int!",
      hourlySwapCount: "Int!",
      timestamp: "BigInt!",
    },
    liquidityPoolHourlySnapshots: {
      id: "ID!",
      totalValueLockedUSD: "BigDecimal!",
      cumulativeSupplySideRevenueUSD: "BigDecimal!",
      hourlySupplySideRevenueUSD: "BigDecimal!",
      cumulativeProtocolSideRevenueUSD: "BigDecimal!",
      hourlyProtocolSideRevenueUSD: "BigDecimal!",
      cumulativeTotalRevenueUSD: "BigDecimal!",
      hourlyTotalRevenueUSD: "BigDecimal!",
      hourlyVolumeUSD: "BigDecimal!",
      hourlyVolumeByTokenAmount: "[BigInt!]!",
      hourlyVolumeByTokenUSD: "[BigDecimal!]!",
      cumulativeVolumeUSD: "BigDecimal!",
      inputTokenBalances: "[BigInt!]!",
      inputTokenWeights: "[BigDecimal!]!",
      outputTokenSupply: "BigInt",
      outputTokenPriceUSD: "BigDecimal",
      stakedOutputTokenAmount: "BigInt",
      rewardTokenEmissionsAmount: "[BigInt!]",
      rewardTokenEmissionsUSD: "[BigDecimal!]",
      timestamp: "BigInt!",
    },
  };

  const finanQuery =
    "financialsDailySnapshots(first: 1000, orderBy: timestamp, orderDirection: desc) {" +
    Object.keys(entitiesData.financialsDailySnapshots).join(",") +
    "}";
  const usageDailyQuery =
    "usageMetricsDailySnapshots(first: 1000, orderBy: timestamp, orderDirection: desc) {" +
    Object.keys(entitiesData.usageMetricsDailySnapshots).join(",") +
    "}";
  const usageHourlyQuery =
    "usageMetricsHourlySnapshots(first: 1000, orderBy: timestamp, orderDirection: desc) {" +
    Object.keys(entitiesData.usageMetricsHourlySnapshots).join(",") +
    "}";

  const liquidityPoolDailyQuery =
    "liquidityPoolDailySnapshots(first: 1000, orderBy: timestamp, orderDirection: desc, where: {pool: $poolId}) {" +
    Object.keys(entitiesData.liquidityPoolDailySnapshots).join(",") +
    "}";
  const liquidityPoolHourlyQuery =
    "liquidityPoolHourlySnapshots(first: 1000, orderBy: timestamp, orderDirection: desc, where: {pool: $poolId}) {" +
    Object.keys(entitiesData.liquidityPoolHourlySnapshots).join(",") +
    "}";

  const eventsFields = ["timestamp", "blockNumber", "from"];

  // Query liquidityPool(pool) entity and events entities
  let events: string[] = ["deposits", "withdraws", "swaps"];
  let eventsQuery: any[] = events.map((event) => {
    let options = "";
    const baseStr =
      event + "(first: 1000, orderBy: timestamp, orderDirection: desc, where: {pool: $poolId}" + options + ") { ";
    let fields = eventsFields.join(",");
    if (event === "swaps") {
      fields += ", hash, amountIn, amountInUSD, amountOutUSD, amountOut, tokenIn{id, decimals}, tokenOut{id, decimals}";
    } else {
      fields +=
        ", hash, amountUSD, inputTokens{id, decimals}, inputTokenAmounts, outputToken{id, decimals}, outputTokenAmount";
    }

    return baseStr + fields + " }";
  });

  const protocolFields = {
    id: "ID!",
    name: "String!",
    slug: "String!",
    schemaVersion: "String!",
    subgraphVersion: "String!",
    methodologyVersion: "String!",
    network: "Network!",
    type: "ProtocolType!",
    totalValueLockedUSD: "BigDecimal!",
    totalPoolCount: "Int!",
    cumulativeVolumeUSD: "BigDecimal!",
    cumulativeSupplySideRevenueUSD: "BigDecimal!",
    cumulativeProtocolSideRevenueUSD: "BigDecimal!",
    cumulativeTotalRevenueUSD: "BigDecimal!",
    cumulativeUniqueUsers: "Int!",
    protocolControlledValueUSD: "BigDecimal",
  };

  const protocolQueryFields = Object.keys(protocolFields).map((x) => x + "\n");

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
      dexAmmProtocol(id: $protocolId) {
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
    id: "ID!",
    name: "String",
    symbol: "String",
    fees: "[LiquidityPoolFee!]!",
    inputTokens: "[Token!]!",
    outputToken: "Token",
    isSingleSided: "Boolean!",
    rewardTokens: "[RewardToken!]",
    totalValueLockedUSD: "BigDecimal!",
    cumulativeSupplySideRevenueUSD: "BigDecimal!",
    cumulativeProtocolSideRevenueUSD: "BigDecimal!",
    cumulativeTotalRevenueUSD: "BigDecimal!",
    cumulativeVolumeUSD: "BigDecimal!",
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
    dexAmmProtocols {
      ${protocolQueryFields}
    }
    ${eventsQuery}
    liquidityPool(id: $poolId){
      id
      name
      symbol
      fees{
        feePercentage
        feeType
      }
      isSingleSided
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
      totalValueLockedUSD
      cumulativeSupplySideRevenueUSD
      cumulativeProtocolSideRevenueUSD
      cumulativeTotalRevenueUSD
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

export const schema200 = (): Schema => {
  const entities = [
    "financialsDailySnapshots",
    "usageMetricsDailySnapshots",
    "liquidityPoolDailySnapshots",
    "usageMetricsHourlySnapshots",
    "liquidityPoolHourlySnapshots",
  ];

  const entitiesData = {
    financialsDailySnapshots: {
      id: "ID!",
      totalValueLockedUSD: "BigDecimal!",
      dailyVolumeUSD: "BigDecimal!",
      cumulativeVolumeUSD: "BigDecimal!",
      dailySupplySideRevenueUSD: "BigDecimal!",
      cumulativeSupplySideRevenueUSD: "BigDecimal!",
      dailyProtocolSideRevenueUSD: "BigDecimal!",
      cumulativeProtocolSideRevenueUSD: "BigDecimal!",
      dailyTotalRevenueUSD: "BigDecimal!",
      cumulativeTotalRevenueUSD: "BigDecimal!",
      timestamp: "BigInt!",
    },
    usageMetricsDailySnapshots: {
      id: "ID!",
      cumulativeUniqueUsers: "Int!",
      dailyActiveUsers: "Int!",
      dailyTransactionCount: "Int!",
      timestamp: "BigInt!",
      totalPoolCount: "Int!",
    },
    liquidityPoolDailySnapshots: {
      id: "ID!",
      totalValueLockedUSD: "BigDecimal!",
      cumulativeSupplySideRevenueUSD: "BigDecimal!",
      dailySupplySideRevenueUSD: "BigDecimal!",
      cumulativeProtocolSideRevenueUSD: "BigDecimal!",
      dailyProtocolSideRevenueUSD: "BigDecimal!",
      cumulativeTotalRevenueUSD: "BigDecimal!",
      dailyTotalRevenueUSD: "BigDecimal!",
      dailyVolumeUSD: "BigDecimal!",
      dailyVolumeByTokenAmount: "[BigInt!]!",
      dailyVolumeByTokenUSD: "[BigDecimal!]!",
      cumulativeVolumeUSD: "BigDecimal!",
      inputTokenBalances: "[BigInt!]!",
      inputTokenWeights: "[BigDecimal!]!",
      outputTokenSupply: "BigInt",
      outputTokenPriceUSD: "BigDecimal",
      stakedOutputTokenAmount: "BigInt",
      rewardTokenEmissionsAmount: "[BigInt!]",
      rewardTokenEmissionsUSD: "[BigDecimal!]",
      timestamp: "BigInt!",
    },
    usageMetricsHourlySnapshots: {
      id: "ID!",
      cumulativeUniqueUsers: "Int!",
      hourlyActiveUsers: "Int!",
      hourlyTransactionCount: "Int!",
      timestamp: "BigInt!",
    },
    liquidityPoolHourlySnapshots: {
      id: "ID!",
      totalValueLockedUSD: "BigDecimal!",
      cumulativeSupplySideRevenueUSD: "BigDecimal!",
      hourlySupplySideRevenueUSD: "BigDecimal!",
      cumulativeProtocolSideRevenueUSD: "BigDecimal!",
      hourlyProtocolSideRevenueUSD: "BigDecimal!",
      cumulativeTotalRevenueUSD: "BigDecimal!",
      hourlyTotalRevenueUSD: "BigDecimal!",
      hourlyVolumeUSD: "BigDecimal!",
      hourlyVolumeByTokenAmount: "[BigInt!]!",
      hourlyVolumeByTokenUSD: "[BigDecimal!]!",
      cumulativeVolumeUSD: "BigDecimal!",
      inputTokenBalances: "[BigInt!]!",
      inputTokenWeights: "[BigDecimal!]!",
      outputTokenSupply: "BigInt",
      outputTokenPriceUSD: "BigDecimal",
      stakedOutputTokenAmount: "BigInt",
      rewardTokenEmissionsAmount: "[BigInt!]",
      rewardTokenEmissionsUSD: "[BigDecimal!]",
      timestamp: "BigInt!",
    },
  };

  const finanQuery =
    "financialsDailySnapshots(first: 1000, orderBy: timestamp, orderDirection: desc) {" +
    Object.keys(entitiesData.financialsDailySnapshots).join(",") +
    "}";
  const usageDailyQuery =
    "usageMetricsDailySnapshots(first: 1000, orderBy: timestamp, orderDirection: desc) {" +
    Object.keys(entitiesData.usageMetricsDailySnapshots).join(",") +
    "}";
  const usageHourlyQuery =
    "usageMetricsHourlySnapshots(first: 1000, orderBy: timestamp, orderDirection: desc) {" +
    Object.keys(entitiesData.usageMetricsHourlySnapshots).join(",") +
    "}";

  const liquidityPoolDailyQuery =
    "liquidityPoolDailySnapshots(first: 1000, orderBy: timestamp, orderDirection: desc, where: {pool: $poolId}) {" +
    Object.keys(entitiesData.liquidityPoolDailySnapshots).join(",") +
    "}";
  const liquidityPoolHourlyQuery =
    "liquidityPoolHourlySnapshots(first: 1000, orderBy: timestamp, orderDirection: desc, where: {pool: $poolId}) {" +
    Object.keys(entitiesData.liquidityPoolHourlySnapshots).join(",") +
    "}";

  const eventsFields = ["timestamp", "blockNumber"];

  // Query liquidityPool(pool) entity and events entities
  let events: string[] = ["deposits", "withdraws", "swaps"];
  let eventsQuery: any[] = events.map((event) => {
    let options = "";
    const baseStr =
      event + "(first: 1000, orderBy: timestamp, orderDirection: desc, where: {pool: $poolId}" + options + ") { ";
    let fields = eventsFields.join(",");
    if (event === "swaps") {
      fields += ", hash, amountIn, amountInUSD, amountOutUSD, amountOut, tokenIn{id, decimals}, tokenOut{id, decimals}";
    } else {
      fields +=
        ", hash, position{id} amountUSD, inputTokens{id, decimals}, inputTokenAmounts, outputToken{id, decimals}, outputTokenAmount";
    }

    return baseStr + fields + " }";
  });

  const protocolFields = {
    id: "ID!",
    name: "String!",
    slug: "String!",
    schemaVersion: "String!",
    subgraphVersion: "String!",
    methodologyVersion: "String!",
    network: "Network!",
    type: "ProtocolType!",
    totalValueLockedUSD: "BigDecimal!",
    totalPoolCount: "Int!",
    cumulativeVolumeUSD: "BigDecimal!",
    cumulativeSupplySideRevenueUSD: "BigDecimal!",
    cumulativeProtocolSideRevenueUSD: "BigDecimal!",
    cumulativeTotalRevenueUSD: "BigDecimal!",
    cumulativeUniqueUsers: "Int!",
    cumulativeUniqueLPs: "Int!",
    cumulativeUniqueTraders: "Int!",
    protocolControlledValueUSD: "BigDecimal",
  };

  const protocolQueryFields = Object.keys(protocolFields).map((x) => x + "\n");

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
      dexAmmProtocol(id: $protocolId) {
        ${protocolQueryFields}
      }
    }`;

  const positionsQuery = `
    positions(first: 1000) {
      id
      account {
        id
      }
      hashOpened
      hashClosed
      timestampOpened
      timestampClosed
      blockNumberOpened
      blockNumberClosed
      inputTokenBalances
      outputTokenBalance
      depositCount
      withdrawCount
      withdraws {
        hash
      }
      deposits {
        hash
      }
    }
`;

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
    id: "ID!",
    name: "String",
    symbol: "String",
    fees: "[LiquidityPoolFee!]!",
    inputTokens: "[Token!]!",
    outputToken: "Token",
    isSingleSided: "Boolean!",
    rewardTokens: "[RewardToken!]",
    totalValueLockedUSD: "BigDecimal!",
    cumulativeSupplySideRevenueUSD: "BigDecimal!",
    cumulativeProtocolSideRevenueUSD: "BigDecimal!",
    cumulativeTotalRevenueUSD: "BigDecimal!",
    cumulativeVolumeUSD: "BigDecimal!",
    inputTokenBalances: "[BigInt!]!",
    inputTokenWeights: "[BigDecimal!]!",
    outputTokenSupply: "BigInt",
    outputTokenPriceUSD: "BigDecimal",
    stakedOutputTokenAmount: "BigInt",
    positionCount: "Int!",
    openPositionCount: "Int!",
    closedPositionCount: ": Int!",
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
    dexAmmProtocols {
      ${protocolQueryFields}
    }
    ${eventsQuery}
    liquidityPool(id: $poolId){
      id
      name
      symbol
      fees{
        feePercentage
        feeType
      }
      isSingleSided
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
      totalValueLockedUSD
      cumulativeSupplySideRevenueUSD
      cumulativeProtocolSideRevenueUSD
      cumulativeTotalRevenueUSD
      cumulativeVolumeUSD
      inputTokenBalances
      inputTokenWeights
      outputTokenSupply
      outputTokenPriceUSD
      stakedOutputTokenAmount
      rewardTokenEmissionsAmount
      rewardTokenEmissionsUSD
      positionCount
      openPositionCount
      closedPositionCount
      ${positionsQuery}
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
    positionsQuery,
  };
};

export const schema303 = (): Schema => {
  const entities = [
    "financialsDailySnapshots",
    "usageMetricsDailySnapshots",
    "liquidityPoolDailySnapshots",
    "usageMetricsHourlySnapshots",
    "liquidityPoolHourlySnapshots",
  ];

  const entitiesData = {
    financialsDailySnapshots: {
      id: "ID!",
      day: "Int!",
      totalValueLockedUSD: "BigDecimal!",
      totalLiquidityUSD: "BigDecimal!",
      activeLiquidityUSD: "BigDecimal!",
      uncollectedProtocolSideValueUSD: "BigDecimal!",
      uncollectedSupplySideValueUSD: "BigDecimal!",
      protocolControlledValueUSD: "BigDecimal",
      dailyVolumeUSD: "BigDecimal!",
      cumulativeVolumeUSD: "BigDecimal!",
      dailySupplySideRevenueUSD: "BigDecimal!",
      cumulativeSupplySideRevenueUSD: "BigDecimal!",
      dailyProtocolSideRevenueUSD: "BigDecimal!",
      cumulativeProtocolSideRevenueUSD: "BigDecimal!",
      dailyTotalRevenueUSD: "BigDecimal!",
      cumulativeTotalRevenueUSD: "BigDecimal!",
      timestamp: "BigInt!",
    },
    usageMetricsDailySnapshots: {
      id: "ID!",
      day: "Int!",
      cumulativeUniqueUsers: "Int!",
      dailyActiveUsers: "Int!",
      dailyTransactionCount: "Int!",
      dailyDepositCount: "Int!",
      dailyWithdrawCount: "Int!",
      dailySwapCount: "Int"!,
      totalPoolCount: "Int!",
      timestamp: "BigInt!",
    },
    liquidityPoolDailySnapshots: {
      id: "ID!",
      day: "Int!",
      tick: "BigInt",
      totalValueLockedUSD: "BigDecimal!",
      totalLiquidity: "BigInt!",
      totalLiquidityUSD: "BigDecimal!",
      activeLiquidity: "BigInt!",
      activeLiquidityUSD: "BigDecimal!",
      uncollectedProtocolSideTokenAmounts: "[BigInt!]!",
      uncollectedProtocolSideValuesUSD: "[BigDecimal!]!",
      uncollectedSupplySideTokenAmounts: "[BigInt!]!",
      uncollectedSupplySideValuesUSD: "[BigDecimal!]!",
      cumulativeSupplySideRevenueUSD: "BigDecimal!",
      dailySupplySideRevenueUSD: "BigDecimal!",
      cumulativeProtocolSideRevenueUSD: "BigDecimal!",
      dailyProtocolSideRevenueUSD: "BigDecimal!",
      cumulativeTotalRevenueUSD: "BigDecimal!",
      dailyTotalRevenueUSD: "BigDecimal!",
      cumulativeVolumeUSD: "BigDecimal!",
      dailyTotalVolumeUSD: "BigDecimal!",
      cumulativeVolumeTokenAmounts: "[BigInt!]!",
      dailyVolumeTokenAmounts: "[BigInt!]!",
      cumulativeVolumesUSD: "[BigDecimal!]!",
      dailyVolumesUSD: "[BigDecimal!]!",
      inputTokenBalances: "[BigInt!]!",
      inputTokenBalancesUSD: "[BigDecimal!]!",
      inputTokenWeights: "[BigDecimal!]!",
      stakedOutputTokenAmount: "BigInt",
      rewardTokenEmissionsAmount: "[BigInt!]",
      rewardTokenEmissionsUSD: "[BigDecimal!]",
      positionCount: "Int!",
      openPositionCount: "Int!",
      closedPositionCount: "Int!",
      cumulativeDepositCount: "Int!",
      dailyDepositCount: "Int!",
      cumulativeWithdrawCount: "Int!",
      dailyWithdrawCount: "Int!",
      cumulativeSwapCount: "Int!",
      dailySwapCount: "Int!",
      timestamp: "BigInt!",
    },
    usageMetricsHourlySnapshots: {
      id: "ID!",
      hour: "Int!",
      cumulativeUniqueUsers: "Int!",
      hourlyActiveUsers: "Int!",
      hourlyTransactionCount: "Int!",
      hourlyDepositCount: "Int!",
      hourlyWithdrawCount: "Int!",
      hourlySwapCount: "Int!",
      timestamp: "BigInt!",
    },
    liquidityPoolHourlySnapshots: {
      id: "ID!",
      hour: "Int!",
      tick: "BigInt",
      totalValueLockedUSD: "BigDecimal!",
      totalLiquidity: "BigInt!",
      totalLiquidityUSD: "BigDecimal!",
      activeLiquidity: "BigInt!",
      activeLiquidityUSD: "BigDecimal!",
      uncollectedProtocolSideTokenAmounts: "[BigInt!]!",
      uncollectedProtocolSideValuesUSD: "[BigDecimal!]!",
      uncollectedSupplySideTokenAmounts: "[BigInt!]!",
      uncollectedSupplySideValuesUSD: "[BigDecimal!]!",
      cumulativeSupplySideRevenueUSD: "BigDecimal!",
      hourlySupplySideRevenueUSD: "BigDecimal!",
      cumulativeProtocolSideRevenueUSD: "BigDecimal!",
      hourlyProtocolSideRevenueUSD: "BigDecimal!",
      cumulativeTotalRevenueUSD: "BigDecimal!",
      hourlyTotalRevenueUSD: "BigDecimal!",
      cumulativeVolumeUSD: "BigDecimal!",
      hourlyTotalVolumeUSD: "BigDecimal!",
      cumulativeVolumeTokenAmounts: "[BigInt!]!",
      hourlyVolumeTokenAmounts: "[BigInt!]!",
      cumulativeVolumesUSD: "[BigDecimal!]!",
      hourlyVolumesUSD: "[BigDecimal!]!",
      inputTokenBalances: "[BigInt!]!",
      inputTokenBalancesUSD: "[BigDecimal!]!",
      inputTokenWeights: "[BigDecimal!]!",
      stakedOutputTokenAmount: "BigInt",
      rewardTokenEmissionsAmount: "[BigInt!]",
      rewardTokenEmissionsUSD: "[BigDecimal!]",
      positionCount: "Int!",
      openPositionCount: "Int!",
      closedPositionCount: "Int!",
      cumulativeDepositCount: "Int!",
      hourlyDepositCount: "Int!",
      cumulativeWithdrawCount: "Int!",
      hourlyWithdrawCount: "Int!",
      cumulativeSwapCount: "Int!",
      hourlySwapCount: "Int!",
      timestamp: "BigInt!",
    },
  };

  const finanQuery =
    "financialsDailySnapshots(first: 1000, orderBy: timestamp, orderDirection: desc) {" +
    Object.keys(entitiesData.financialsDailySnapshots).join(",") +
    "}";
  const usageDailyQuery =
    "usageMetricsDailySnapshots(first: 1000, orderBy: timestamp, orderDirection: desc) {" +
    Object.keys(entitiesData.usageMetricsDailySnapshots).join(",") +
    "}";
  const usageHourlyQuery =
    "usageMetricsHourlySnapshots(first: 1000, orderBy: timestamp, orderDirection: desc) {" +
    Object.keys(entitiesData.usageMetricsHourlySnapshots).join(",") +
    "}";

  const liquidityPoolDailyQuery =
    "liquidityPoolDailySnapshots(first: 1000, orderBy: timestamp, orderDirection: desc, where: {pool: $poolId}) {" +
    Object.keys(entitiesData.liquidityPoolDailySnapshots).join(",") +
    "}";
  const liquidityPoolHourlyQuery =
    "liquidityPoolHourlySnapshots(first: 1000, orderBy: timestamp, orderDirection: desc, where: {pool: $poolId}) {" +
    Object.keys(entitiesData.liquidityPoolHourlySnapshots).join(",") +
    "}";

  const eventsFields = ["timestamp", "blockNumber"];

  // Query liquidityPool(pool) entity and events entities
  let events: string[] = ["deposits", "withdraws", "swaps"];
  let eventsQuery: any[] = events.map((event) => {
    let options = "";
    const baseStr =
      event + "(first: 1000, orderBy: timestamp, orderDirection: desc, where: {pool: $poolId}" + options + ") { ";
    let fields = eventsFields.join(",");
    if (event === "swaps") {
      fields += ", hash, amountIn, amountInUSD, amountOutUSD, amountOut, tokenIn{id, decimals}, tokenOut{id, decimals}";
    } else {
      fields += ", hash, position{id} amountUSD, inputTokens{id, decimals}, inputTokenAmounts";
    }

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

  const protocolFields = {
    id: "ID!",
    name: "String!",
    slug: "String!",
    schemaVersion: "String!",
    subgraphVersion: "String!",
    methodologyVersion: "String!",
    network: "Network!",
    type: "ProtocolType!",
    totalValueLockedUSD: "BigDecimal!",
    totalLiquidityUSD: "BigDecimal!",
    activeLiquidityUSD: "BigDecimal!",
    uncollectedProtocolSideValueUSD: "BigDecimal!",
    uncollectedSupplySideValueUSD: "BigDecimal!",
    protocolControlledValueUSD: "BigDecimal",
    cumulativeVolumeUSD: "BigDecimal!",
    cumulativeSupplySideRevenueUSD: "BigDecimal!",
    cumulativeProtocolSideRevenueUSD: "BigDecimal!",
    cumulativeTotalRevenueUSD: "BigDecimal!",
    cumulativeUniqueUsers: "Int!",
    cumulativeUniqueLPs: "Int!",
    cumulativeUniqueTraders: "Int!",
    totalPoolCount: "Int!",
    openPositionCount: "Int!",
    cumulativePositionCount: "Int!",
  };

  const protocolQueryFields = Object.keys(protocolFields).map((x) => x + "\n");

  const protocolTableQuery = `
    query Data($protocolId: String) {
      dexAmmProtocol(id: $protocolId) {
        ${protocolQueryFields}
      }
    }`;

  const positionsQuery = `
    positions(first: 1000) {
      id
      account {
        id
      }
      hashOpened
      hashClosed
      timestampOpened
      timestampClosed
      blockNumberOpened
      blockNumberClosed
      depositCount
      withdrawCount
      withdraws {
        hash
      }
      deposits {
        hash
      }
    }
`;

  const poolsQuery = `
      query Data {
        liquidityPools(first: 100, orderBy: totalValueLockedUSD, orderDirection: desc) {
          id
          name
        }
      }
    `;

  const poolData: { [x: string]: string } = {
    id: "Bytes!",
    protocol: "DexAmmProtocol!",
    name: "String",
    symbol: "String",
    liquidityToken: "Token",
    liquidityTokenType: "TokenType",
    inputTokens: "[Token!]!",
    rewardTokens: "[RewardToken!]",
    fees: "[LiquidityPoolFee!]!",
    isSingleSided: "Boolean!",
    createdTimestamp: "BigInt!",
    createdBlockNumber: "BigInt!",
    tick: "BigInt",
    totalValueLockedUSD: "BigDecimal!",
    totalLiquidity: "BigInt!",
    totalLiquidityUSD: "BigDecimal!",
    activeLiquidity: "BigInt!",
    activeLiquidityUSD: "BigDecimal!",
    uncollectedProtocolSideTokenAmounts: "[BigInt!]!",
    uncollectedProtocolSideValuesUSD: "[BigDecimal!]!",
    uncollectedSupplySideTokenAmounts: "[BigInt!]!",
    uncollectedSupplySideValuesUSD: "[BigDecimal!]!",
    cumulativeSupplySideRevenueUSD: "BigDecimal!",
    cumulativeProtocolSideRevenueUSD: "BigDecimal!",
    cumulativeTotalRevenueUSD: "BigDecimal!",
    cumulativeVolumeTokenAmounts: "[BigInt!]!",
    cumulativeVolumesUSD: "[BigDecimal!]!",
    cumulativeVolumeUSD: "BigDecimal!",
    cumulativeDepositCount: "Int!",
    cumulativeWithdrawCount: "Int!",
    cumulativeSwapCount: "Int!",
    inputTokenBalances: "[BigInt!]!",
    inputTokenBalancesUSD: "[BigDecimal!]!",
    inputTokenWeights: "[BigDecimal!]!",
    stakedOutputTokenAmount: "BigInt",
    rewardTokenEmissionsAmount: "[BigInt!]",
    rewardTokenEmissionsUSD: "[BigDecimal!]",
    positionCount: "Int!",
    openPositionCount: "Int!",
    closedPositionCount: "Int!",
    lastSnapshotDayID: "Int!",
    lastSnapshotHourID: "Int!",
    lastUpdateTimestamp: "BigInt!",
    lastUpdateBlockNumber: "BigInt!",
  };

  const poolTimeseriesQuery = `
      query Data($poolId: String) {
        ${liquidityPoolDailyQuery}
        ${liquidityPoolHourlyQuery}
      }
      `;

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
    dexAmmProtocols {
      ${protocolQueryFields}
    }
    ${eventsQuery}
    liquidityPool(id: $poolId){
      id
      name
      symbol
      fees{
        feePercentage
        feeType
      }
      inputTokens{
        id
        decimals
        name
        symbol
      }
      liquidityToken {
        id
        decimals
        name
        symbol
      }
      liquidityTokenType
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
      lastSnapshotDayID
      lastSnapshotHourID
      lastUpdateTimestamp
      lastUpdateBlockNumber
      isSingleSided
      createdTimestamp
      createdBlockNumber
      tick
      totalValueLockedUSD
      totalLiquidity
      totalLiquidityUSD
      activeLiquidity
      activeLiquidityUSD
      uncollectedProtocolSideTokenAmounts
      uncollectedProtocolSideValuesUSD
      uncollectedSupplySideTokenAmounts
      uncollectedSupplySideValuesUSD
      cumulativeSupplySideRevenueUSD
      cumulativeProtocolSideRevenueUSD
      cumulativeTotalRevenueUSD
      cumulativeVolumeTokenAmounts
      cumulativeDepositCount
      cumulativeWithdrawCount    
      cumulativeSwapCount
      cumulativeVolumeUSD
      inputTokenBalances
      inputTokenBalancesUSD
      inputTokenWeights
      stakedOutputTokenAmount
      rewardTokenEmissionsAmount
      rewardTokenEmissionsUSD
      positionCount
      openPositionCount
      closedPositionCount
      ${positionsQuery}
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
    positionsQuery,
  };
};
