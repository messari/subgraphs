import { Schema, Versions } from "../../constants";

export const versionsList = ["1.4.0", "2.1.0", "3.0.0"];

export const schema = (version: string): Schema => {
  // The version group uses the first two digits  of the schema version and defaults to that schema.
  const versionGroupArr = version.split(".");
  versionGroupArr.pop();
  const versionGroup = versionGroupArr.join(".") + ".0";
  switch (versionGroup) {
    case Versions.Schema140:
      return schema140();
    case Versions.Schema210:
      return schema210();
    case Versions.Schema300:
      return schema300();
    default:
      return schema300();
  }
};

export const schema140 = (): Schema => {
  const entities = [
    "financialsDailySnapshots",
    "usageMetricsDailySnapshots",
    "poolDailySnapshots",
    "usageMetricsHourlySnapshots",
    "poolHourlySnapshots",
  ];

  const entitiesData = {
    financialsDailySnapshots: {
      id: "ID!",
      totalValueLockedUSD: "BigDecimal!",
      dailySupplySideRevenueUSD: "BigDecimal!",
      cumulativeSupplySideRevenueUSD: "BigDecimal!",
      dailyProtocolSideRevenueUSD: "BigDecimal!",
      cumulativeProtocolSideRevenueUSD: "BigDecimal!",
      dailyTotalRevenueUSD: "BigDecimal!",
      cumulativeTotalRevenueUSD: "BigDecimal!",
      timestamp: "BigInt!",
      blockNumber: "BigInt!",
    },
    usageMetricsDailySnapshots: {
      id: "ID!",
      cumulativeUniqueUsers: "Int!",
      dailyActiveUsers: "Int!",
      dailyTransactionCount: "Int!",
      timestamp: "BigInt!",
      totalPoolCount: "Int!",
      blockNumber: "BigInt!",
    },
    poolDailySnapshots: {
      id: "ID!",
      totalValueLockedUSD: "BigDecimal!",
      cumulativeSupplySideRevenueUSD: "BigDecimal!",
      dailySupplySideRevenueUSD: "BigDecimal!",
      cumulativeProtocolSideRevenueUSD: "BigDecimal!",
      dailyProtocolSideRevenueUSD: "BigDecimal!",
      cumulativeTotalRevenueUSD: "BigDecimal!",
      dailyTotalRevenueUSD: "BigDecimal!",
      inputTokenBalances: "[BigInt!]!",
      outputTokenSupply: "BigInt",
      outputTokenPriceUSD: "BigDecimal",
      stakedOutputTokenAmount: "BigInt",
      rewardTokenEmissionsAmount: "[BigInt!]",
      rewardTokenEmissionsUSD: "[BigDecimal!]",
      timestamp: "BigInt!",
      blockNumber: "BigInt!",
    },
    usageMetricsHourlySnapshots: {
      id: "ID!",
      cumulativeUniqueUsers: "Int!",
      hourlyActiveUsers: "Int!",
      hourlyTransactionCount: "Int!",
      timestamp: "BigInt!",
      blockNumber: "BigInt!",
    },
    poolHourlySnapshots: {
      id: "ID!",
      totalValueLockedUSD: "BigDecimal!",
      cumulativeSupplySideRevenueUSD: "BigDecimal!",
      hourlySupplySideRevenueUSD: "BigDecimal!",
      cumulativeProtocolSideRevenueUSD: "BigDecimal!",
      hourlyProtocolSideRevenueUSD: "BigDecimal!",
      cumulativeTotalRevenueUSD: "BigDecimal!",
      hourlyTotalRevenueUSD: "BigDecimal!",
      inputTokenBalances: "[BigInt!]!",
      outputTokenSupply: "BigInt",
      outputTokenPriceUSD: "BigDecimal",
      stakedOutputTokenAmount: "BigInt",
      rewardTokenEmissionsAmount: "[BigInt!]",
      rewardTokenEmissionsUSD: "[BigDecimal!]",
      timestamp: "BigInt!",
      blockNumber: "BigInt!",
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

  const poolDailyQuery =
    "poolDailySnapshots(first: 1000, orderBy: timestamp, orderDirection: desc, where: {pool: $poolId}) {" +
    Object.keys(entitiesData.poolDailySnapshots).join(",") +
    "}";
  const poolHourlyQuery =
    "poolHourlySnapshots(first: 1000, orderBy: timestamp, orderDirection: desc, where: {pool: $poolId}) {" +
    Object.keys(entitiesData.poolHourlySnapshots).join(",") +
    "}";

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
    cumulativeSupplySideRevenueUSD: "BigDecimal!",
    cumulativeProtocolSideRevenueUSD: "BigDecimal!",
    cumulativeTotalRevenueUSD: "BigDecimal!",
    cumulativeUniqueUsers: "Int!",
    protocolControlledValueUSD: "BigDecimal",
  };

  const protocolQueryFields = Object.keys(protocolFields).map((x) => x + "\n");

  // Query pool(pool) entity and events entities
  let events: string[] = [];

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
      protocol(id: $protocolId) {
        ${protocolQueryFields}
      }
    }`;

  const poolsQuery = `
      query Data {
        pools(first: 100, orderBy: totalValueLockedUSD, orderDirection: desc) {
          id
          name
        }
      }
    `;

  const poolTimeseriesQuery = `
      query Data($poolId: String) {
        ${poolDailyQuery}
        ${poolHourlyQuery}
      }
      `;

  const poolData: { [x: string]: string } = {
    id: "ID!",
    name: "String",
    symbol: "String",
    inputTokens: "[Token!]!",
    outputToken: "Token",
    isSingleSided: "Boolean!",
    rewardTokens: "[RewardToken!]",
    totalValueLockedUSD: "BigDecimal!",
    cumulativeSupplySideRevenueUSD: "BigDecimal!",
    cumulativeProtocolSideRevenueUSD: "BigDecimal!",
    cumulativeTotalRevenueUSD: "BigDecimal!",
    inputTokenBalances: "[BigInt!]!",
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
      ${protocolQueryFields}
    }

    pool(id: $poolId){
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
      totalValueLockedUSD
      cumulativeSupplySideRevenueUSD
      cumulativeProtocolSideRevenueUSD
      cumulativeTotalRevenueUSD
      inputTokenBalances
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

export const schema210 = (): Schema => {
  const entities = [
    "financialsDailySnapshots",
    "usageMetricsDailySnapshots",
    "poolDailySnapshots",
    "usageMetricsHourlySnapshots",
    "poolHourlySnapshots",
  ];

  const entitiesData = {
    financialsDailySnapshots: {
      id: "ID!",
      totalValueLockedUSD: "BigDecimal!",
      dailySupplySideRevenueUSD: "BigDecimal!",
      cumulativeSupplySideRevenueUSD: "BigDecimal!",
      dailyProtocolSideRevenueUSD: "BigDecimal!",
      cumulativeProtocolSideRevenueUSD: "BigDecimal!",
      dailyTotalRevenueUSD: "BigDecimal!",
      cumulativeTotalRevenueUSD: "BigDecimal!",
      timestamp: "BigInt!",
      blockNumber: "BigInt!",
    },
    usageMetricsDailySnapshots: {
      id: "ID!",
      cumulativeUniqueUsers: "Int!",
      dailyActiveUsers: "Int!",
      cumulativeTransactionCount: "Int!",
      dailyTransactionCount: "Int!",
      timestamp: "BigInt!",
      totalPoolCount: "Int!",
      blockNumber: "BigInt!",
    },
    poolDailySnapshots: {
      id: "ID!",
      totalValueLockedUSD: "BigDecimal!",
      cumulativeSupplySideRevenueUSD: "BigDecimal!",
      dailySupplySideRevenueUSD: "BigDecimal!",
      cumulativeProtocolSideRevenueUSD: "BigDecimal!",
      dailyProtocolSideRevenueUSD: "BigDecimal!",
      cumulativeTotalRevenueUSD: "BigDecimal!",
      dailyTotalRevenueUSD: "BigDecimal!",
      inputTokenBalances: "[BigInt!]!",
      inputTokenBalancesUSD: "[BigDecimal!]!",
      outputTokenSupply: "BigInt",
      outputTokenPriceUSD: "BigDecimal",
      stakedOutputTokenAmount: "BigInt",
      rewardTokenEmissionsAmount: "[BigInt!]",
      rewardTokenEmissionsUSD: "[BigDecimal!]",
      timestamp: "BigInt!",
      blockNumber: "BigInt!",
    },
    usageMetricsHourlySnapshots: {
      id: "ID!",
      cumulativeUniqueUsers: "Int!",
      hourlyActiveUsers: "Int!",
      cumulativeTransactionCount: "Int!",
      hourlyTransactionCount: "Int!",
      timestamp: "BigInt!",
      blockNumber: "BigInt!",
    },
    poolHourlySnapshots: {
      id: "ID!",
      totalValueLockedUSD: "BigDecimal!",
      cumulativeSupplySideRevenueUSD: "BigDecimal!",
      hourlySupplySideRevenueUSD: "BigDecimal!",
      cumulativeProtocolSideRevenueUSD: "BigDecimal!",
      hourlyProtocolSideRevenueUSD: "BigDecimal!",
      cumulativeTotalRevenueUSD: "BigDecimal!",
      hourlyTotalRevenueUSD: "BigDecimal!",
      inputTokenBalances: "[BigInt!]!",
      inputTokenBalancesUSD: "[BigDecimal!]!",
      outputTokenSupply: "BigInt",
      outputTokenPriceUSD: "BigDecimal",
      stakedOutputTokenAmount: "BigInt",
      rewardTokenEmissionsAmount: "[BigInt!]",
      rewardTokenEmissionsUSD: "[BigDecimal!]",
      timestamp: "BigInt!",
      blockNumber: "BigInt!",
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

  const poolDailyQuery =
    "poolDailySnapshots(first: 1000, orderBy: timestamp, orderDirection: desc, where: {pool: $poolId}) {" +
    Object.keys(entitiesData.poolDailySnapshots).join(",") +
    "}";
  const poolHourlyQuery =
    "poolHourlySnapshots(first: 1000, orderBy: timestamp, orderDirection: desc, where: {pool: $poolId}) {" +
    Object.keys(entitiesData.poolHourlySnapshots).join(",") +
    "}";

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
    cumulativeSupplySideRevenueUSD: "BigDecimal!",
    cumulativeProtocolSideRevenueUSD: "BigDecimal!",
    cumulativeTotalRevenueUSD: "BigDecimal!",
    cumulativeTransactionCount: "Int!",
    cumulativeUniqueUsers: "Int!",
    protocolControlledValueUSD: "BigDecimal",
  };

  const protocolQueryFields = Object.keys(protocolFields).map((x) => x + "\n");

  // Query pool(pool) entity and events entities
  let events: string[] = [];

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
      protocol(id: $protocolId) {
        ${protocolQueryFields}
      }
    }`;

  const poolsQuery = `
      query Data {
        pools(first: 100, orderBy: totalValueLockedUSD, orderDirection: desc) {
          id
          name
        }
      }
    `;

  const poolTimeseriesQuery = `
      query Data($poolId: String) {
        ${poolDailyQuery}
        ${poolHourlyQuery}
      }
      `;

  const poolData: { [x: string]: string } = {
    id: "ID!",
    name: "String",
    symbol: "String",
    inputTokens: "[Token!]!",
    outputToken: "Token",
    isLiquidityToken: "Boolean!",
    rewardTokens: "[RewardToken!]",
    totalValueLockedUSD: "BigDecimal!",
    cumulativeSupplySideRevenueUSD: "BigDecimal!",
    cumulativeProtocolSideRevenueUSD: "BigDecimal!",
    cumulativeTotalRevenueUSD: "BigDecimal!",
    inputTokenBalances: "[BigInt!]!",
    inputTokenBalancesUSD: "[BigDecimal!]!",
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
      ${protocolQueryFields}
    }

    pool(id: $poolId){
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
      totalValueLockedUSD
      cumulativeSupplySideRevenueUSD
      cumulativeProtocolSideRevenueUSD
      cumulativeTotalRevenueUSD
      inputTokenBalances
      inputTokenBalancesUSD
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

export const schema300 = (): Schema => {
  const entities = ["financialsDailySnapshots", "usageMetricsDailySnapshots", "poolDailySnapshots"];

  const entitiesData = {
    financialsDailySnapshots: {
      id: "ID!",
      totalValueLockedUSD: "BigDecimal!",
      dailySupplySideRevenueUSD: "BigDecimal!",
      cumulativeSupplySideRevenueUSD: "BigDecimal!",
      dailyProtocolSideRevenueUSD: "BigDecimal!",
      cumulativeProtocolSideRevenueUSD: "BigDecimal!",
      dailyTotalRevenueUSD: "BigDecimal!",
      cumulativeTotalRevenueUSD: "BigDecimal!",
      timestamp: "BigInt!",
      blockNumber: "BigInt!",
    },
    usageMetricsDailySnapshots: {
      id: "ID!",
      cumulativeUniqueUsers: "Int!",
      dailyActiveUsers: "Int!",
      cumulativeTransactionCount: "Int!",
      dailyTransactionCount: "Int!",
      totalPoolCount: "Int!",
      timestamp: "BigInt!",
      blockNumber: "BigInt!",
    },
    poolDailySnapshots: {
      id: "ID!",
      totalValueLockedUSD: "BigDecimal!",
      cumulativeSupplySideRevenueUSD: "BigDecimal!",
      dailySupplySideRevenueUSD: "BigDecimal!",
      cumulativeProtocolSideRevenueUSD: "BigDecimal!",
      dailyProtocolSideRevenueUSD: "BigDecimal!",
      cumulativeTotalRevenueUSD: "BigDecimal!",
      dailyTotalRevenueUSD: "BigDecimal!",
      inputTokenBalances: "[BigInt!]!",
      inputTokenBalancesUSD: "[BigDecimal!]!",
      outputTokenSupply: "BigInt",
      timestamp: "BigInt!",
      blockNumber: "BigInt!",
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
  const poolDailyQuery =
    "poolDailySnapshots(first: 1000, orderBy: timestamp, orderDirection: desc, where: {pool: $poolId}) {" +
    Object.keys(entitiesData.poolDailySnapshots).join(",") +
    "}";

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
    cumulativeSupplySideRevenueUSD: "BigDecimal!",
    cumulativeProtocolSideRevenueUSD: "BigDecimal!",
    cumulativeTotalRevenueUSD: "BigDecimal!",
    cumulativeTransactionCount: "Int!",
    cumulativeUniqueUsers: "Int!",
    totalPoolCount: "Int!",
  };

  const protocolQueryFields = Object.keys(protocolFields).map((x) => x + "\n");

  // Query pool(pool) entity and events entities
  let events: string[] = [];

  const financialsQuery = `
    query Data {
      ${finanQuery}
    }`;
  const dailyUsageQuery = `
    query Data {
      ${usageDailyQuery}
    }`;

  const protocolTableQuery = `
    query Data($protocolId: String) {
      protocol(id: $protocolId) {
        ${protocolQueryFields}
      }
    }`;

  const poolsQuery = `
      query Data {
        pools(first: 100, orderBy: totalValueLockedUSD, orderDirection: desc) {
          id
          name
        }
      }
    `;

  const poolTimeseriesQuery = `
      query Data($poolId: String) {
        ${poolDailyQuery}
      }
      `;

  const poolData: { [x: string]: string } = {
    id: "ID!",
    name: "String",
    symbol: "String",
    inputTokens: "[Token!]!",
    outputToken: "Token",
    totalValueLockedUSD: "BigDecimal!",
    cumulativeSupplySideRevenueUSD: "BigDecimal!",
    cumulativeProtocolSideRevenueUSD: "BigDecimal!",
    cumulativeTotalRevenueUSD: "BigDecimal!",
    inputTokenBalances: "[BigInt!]!",
    inputTokenBalancesUSD: "[BigDecimal!]!",
    outputTokenSupply: "BigInt",
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
      ${protocolQueryFields}
    }

    pool(id: $poolId){
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
      totalValueLockedUSD
      cumulativeSupplySideRevenueUSD
      cumulativeProtocolSideRevenueUSD
      cumulativeTotalRevenueUSD
      inputTokenBalances
      inputTokenBalancesUSD
      outputTokenSupply
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
    dailyUsageQuery,
    poolTimeseriesQuery,
  };
};
