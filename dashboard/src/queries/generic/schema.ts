import { Schema, Versions } from "../../constants";

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
    case Versions.Schema120:
      return schema120();
    case Versions.Schema130:
    default:
      return schema130();
  }
};

export const schema100 = (): Schema => {
  const entities = ["financialsDailySnapshots", "usageMetricsDailySnapshots", "poolDailySnapshots"];

  const entitiesData = {
    financialsDailySnapshots: {
      totalValueLockedUSD: "BigDecimal!",
      totalVolumeUSD: "BigDecimal!",
      protocolSideRevenueUSD: "BigDecimal!",
      supplySideRevenueUSD: "BigDecimal!",
      feesUSD: "BigDecimal!",
    },
    usageMetricsDailySnapshots: {
      totalUniqueUsers: "Int!",
      dailyTransactionCount: "Int!",
      activeUsers: "Int!",
    },
    poolDailySnapshots: {
      totalValueLockedUSD: "BigDecimal!",
      totalVolumeUSD: "BigDecimal!",
      inputTokenBalances: "[BigInt!]!",
      outputTokenSupply: "BigInt!",
      outputTokenPriceUSD: "BigDecimal!",
      rewardTokenEmissionsAmount: "[BigInt!]!",
      rewardTokenEmissionsUSD: "[BigDecimal!]!",
      timestamp: "BigInt!",
    },
  };
  const query = `
      query Data($poolId: String, $protocolId: String){
        _meta {
          block {
            number
          }
          deployment
        }
        protocols {
          name
          type
          schemaVersion
          subgraphVersion
        }
        protocol(id: $protocolId) {
          id
          name
          slug
          schemaVersion
          subgraphVersion
          network
          type
          totalUniqueUsers
          totalValueLockedUSD
        }
        protocols {
          id
          name
          slug
          schemaVersion
          subgraphVersion
          network
          type
          totalUniqueUsers
          totalValueLockedUSD
        }
        pools {
          id
          name
        }
        financialsDailySnapshots(first: 1000, orderBy: timestamp, orderDirection: desc) {
          totalValueLockedUSD
          totalVolumeUSD
          protocolSideRevenueUSD
          supplySideRevenueUSD
          feesUSD
          timestamp
        }
        usageMetricsDailySnapshots(first: 1000, orderBy: timestamp, orderDirection: desc) {
          totalUniqueUsers
          dailyTransactionCount
          activeUsers
          timestamp
        }
        poolDailySnapshots(first:1000, orderBy: timestamp, orderDirection: desc, where: {pool: $poolId}) {
          totalValueLockedUSD
          inputTokenBalances
          outputTokenSupply
          outputTokenPriceUSD
          rewardTokenEmissionsAmount
          rewardTokenEmissionsUSD
          totalVolumeUSD
          timestamp
        }
        pool(id: $poolId){
          fees{
            feePercentage
            feeType
          }
          inputTokens {
            name
          }
          outputToken {
            name
            decimals
          }
          rewardTokens {
            id
          }
          name
          symbol
        }
        withdraws(first: 1000, orderBy: timestamp, orderDirection: desc, where: {pool: $poolId}) {
          amountUSD
          blockNumber
          from
          timestamp
        }
        deposits(first: 1000, orderBy: timestamp, orderDirection: desc, where: {pool: $poolId}) {
          timestamp
          blockNumber
          from
          amountUSD
        }
        swaps(first: 1000, orderBy: timestamp, orderDirection: desc, where: {pool: $poolId}) {
          timestamp
          from
          amountIn
          amountInUSD
          amountOutUSD
          amountOut
        }
      }
    `;

  const poolData = {
    id: "ID!",
    name: "String",
    symbol: "String",
    fees: "[poolFee!]!",
    inputTokens: "[Token!]!",
    outputToken: "Token",
    rewardTokens: "[RewardToken!]",
  };

  const protocolFields = {
    id: "ID!",
    name: "String!",
    slug: "String!",
    schemaVersion: "String!",
    subgraphVersion: "String!",
    network: "Network!",
    type: "ProtocolType!",
    totalUniqueUsers: "Int!",
    totalValueLockedUSD: "BigDecimal!",
  };

  const events = ["withdraws", "deposits", "swaps"];
  return {
    entities,
    entitiesData,
    query,
    poolData,
    events,
    protocolFields,
    poolTimeseriesQuery: "",
    financialsQuery: "",
    hourlyUsageQuery: "",
    dailyUsageQuery: "",
    protocolTableQuery: "",
    poolsQuery: "",
  };
};

export const schema110 = (): Schema => {
  const entities = ["financialsDailySnapshots", "usageMetricsDailySnapshots", "poolDailySnapshots"];

  const entitiesData = {
    financialsDailySnapshots: {
      totalValueLockedUSD: "BigDecimal!",
      totalVolumeUSD: "BigDecimal!",
      protocolSideRevenueUSD: "BigDecimal!",
      supplySideRevenueUSD: "BigDecimal!",
      totalRevenueUSD: "BigDecimal!",
    },
    usageMetricsDailySnapshots: {
      totalUniqueUsers: "Int!",
      dailyTransactionCount: "Int!",
      activeUsers: "Int!",
    },
    poolDailySnapshots: {
      totalValueLockedUSD: "BigDecimal!",
      totalVolumeUSD: "BigDecimal!",
      inputTokenBalances: "[BigInt!]!",
      outputTokenSupply: "BigInt!",
      outputTokenPriceUSD: "BigDecimal!",
      rewardTokenEmissionsAmount: "[BigInt!]!",
      rewardTokenEmissionsUSD: "[BigDecimal!]!",
      timestamp: "BigInt!",
    },
  };
  const query = `
      query Data($poolId: String, $protocolId: String){
        _meta {
          block {
            number
          }
          deployment
        }
        protocols {
          name
          type
          schemaVersion
          subgraphVersion
        }
        protocol(id: $protocolId) {
          id
          name
          slug
          schemaVersion
          subgraphVersion
          methodologyVersion
          network
          type
          totalUniqueUsers
          totalValueLockedUSD
          totalVolumeUSD
        }
        protocols {
          id
          name
          slug
          schemaVersion
          subgraphVersion
          methodologyVersion
          network
          type
          totalUniqueUsers
          totalValueLockedUSD
          totalVolumeUSD
        }
        financialsDailySnapshots(first: 1000, orderBy: timestamp, orderDirection: desc) {
          totalValueLockedUSD
          totalVolumeUSD
          protocolSideRevenueUSD
          supplySideRevenueUSD
          timestamp
        }
        pools {
          id
          name
          fees{
            feePercentage
            feeType
          }
          inputTokens{
            decimals
            name
          }
          outputToken {
            id
            decimals
          }
          rewardTokens {
            id
          }
          symbol
        }
        usageMetricsDailySnapshots(first: 1000, orderBy: timestamp, orderDirection: desc) {
          totalUniqueUsers
          dailyTransactionCount
          activeUsers
          timestamp
        }
        poolDailySnapshots(first:1000, orderBy: timestamp, orderDirection: desc, where: {pool: $poolId}) {
          totalValueLockedUSD
          inputTokenBalances
          outputTokenSupply
          outputTokenPriceUSD
          rewardTokenEmissionsAmount
          rewardTokenEmissionsUSD
          totalVolumeUSD
          timestamp
        }
        pool(id: $poolId){
          id
          name
          fees{
            feePercentage
            feeType
          }
          inputTokens{
            decimals
            name
          }
          outputToken {
            id
            decimals
          }
          rewardTokens {
            id
          }
          symbol
        }
        withdraws(first: 1000, orderBy: timestamp, orderDirection: desc, where: {pool: $poolId}) {
          amountUSD
          blockNumber
          from
          timestamp
        }
        deposits(first: 1000, orderBy: timestamp, orderDirection: desc, where: {pool: $poolId}) {
          timestamp
          blockNumber
          from
          amountUSD
        }
        swaps(first: 1000, orderBy: timestamp, orderDirection: desc, where: {pool: $poolId}) {
          timestamp
          from
          amountIn
          amountInUSD
          amountOutUSD
          amountOut
        }
      }
      `;

  const poolData = {
    id: "ID!",
    name: "String",
    symbol: "String",
    fees: "[poolFee!]!",
    inputTokens: "[Token!]!",
    outputToken: "Token",
    rewardTokens: "[RewardToken!]",
  };

  const events = ["withdraws", "deposits", "swaps"];

  const protocolFields = {
    id: "ID!",
    name: "String!",
    slug: "String!",
    schemaVersion: "String!",
    subgraphVersion: "String!",
    methodologyVersion: "String!",
    network: "Network!",
    type: "ProtocolType!",
    totalUniqueUsers: "Int!",
    totalValueLockedUSD: "BigDecimal!",
    totalVolumeUSD: "BigDecimal!",
  };

  return {
    entities,
    entitiesData,
    query,
    poolData,
    events,
    protocolFields,
    poolTimeseriesQuery: "",
    financialsQuery: "",
    hourlyUsageQuery: "",
    dailyUsageQuery: "",
    protocolTableQuery: "",
    poolsQuery: "",
  };
};

export const schema120 = (): Schema => {
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
    },
    usageMetricsDailySnapshots: {
      id: "ID!",
      cumulativeUniqueUsers: "Int!",
      dailyActiveUsers: "Int!",
      dailyTransactionCount: "Int!",
      timestamp: "BigInt!",
    },
    poolDailySnapshots: {
      id: "ID!",
      totalValueLockedUSD: "BigDecimal!",
      inputTokenBalances: "[BigInt!]!",
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
    poolHourlySnapshots: {
      id: "ID!",
      totalValueLockedUSD: "BigDecimal!",
      inputTokenBalances: "[BigInt!]!",
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

  const poolDailyQuery =
    "poolDailySnapshots(first: 1000, orderBy: timestamp, orderDirection: desc, where: {pool: $poolId}) {" +
    Object.keys(entitiesData.poolDailySnapshots).join(",") +
    "}";
  const poolHourlyQuery =
    "poolHourlySnapshots(first: 1000, orderBy: timestamp, orderDirection: desc, where: {pool: $poolId}) {" +
    Object.keys(entitiesData.poolHourlySnapshots).join(",") +
    "}";

  const poolData: { [x: string]: string } = {
    id: "ID!",
    name: "String",
    symbol: "String",
    inputTokens: "[Token!]!",
    outputToken: "Token",
    rewardTokens: "[RewardToken!]",
    totalValueLockedUSD: "BigDecimal!",
    inputTokenBalances: "[BigInt!]!",
    outputTokenSupply: "BigInt",
    outputTokenPriceUSD: "BigDecimal",
    stakedOutputTokenAmount: "BigInt",
    rewardTokenEmissionsAmount: "[BigInt!]",
    rewardTokenEmissionsUSD: "[BigDecimal!]",
  };

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
        id
        name
        slug
        schemaVersion
        subgraphVersion
        methodologyVersion
        network
        type
        totalValueLockedUSD
        cumulativeSupplySideRevenueUSD
        cumulativeProtocolSideRevenueUSD
        cumulativeTotalRevenueUSD
        cumulativeUniqueUsers
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
      name
      type
      schemaVersion
      subgraphVersion
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
        token {
          id
          decimals
          name
          symbol
        }
      }
      totalValueLockedUSD
      inputTokenBalances
      outputTokenSupply
      outputTokenPriceUSD
      stakedOutputTokenAmount
      rewardTokenEmissionsAmount
      rewardTokenEmissionsUSD
    }
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
    cumulativeSupplySideRevenueUSD: "BigDecimal!",
    cumulativeProtocolSideRevenueUSD: "BigDecimal!",
    cumulativeTotalRevenueUSD: "BigDecimal!",
    cumulativeUniqueUsers: "Int!",
  };

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
    },
    usageMetricsDailySnapshots: {
      id: "ID!",
      cumulativeUniqueUsers: "Int!",
      dailyActiveUsers: "Int!",
      dailyTransactionCount: "Int!",
      timestamp: "BigInt!",
      totalPoolCount: "Int!",
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
    },
    usageMetricsHourlySnapshots: {
      id: "ID!",
      cumulativeUniqueUsers: "Int!",
      hourlyActiveUsers: "Int!",
      hourlyTransactionCount: "Int!",
      timestamp: "BigInt!",
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

  const poolData: { [x: string]: string } = {
    id: "ID!",
    name: "String",
    symbol: "String",
    fees: "[poolFee!]!",
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
        id
        name
        slug
        schemaVersion
        subgraphVersion
        methodologyVersion
        network
        type
        totalValueLockedUSD
        cumulativeSupplySideRevenueUSD
        cumulativeProtocolSideRevenueUSD
        cumulativeTotalRevenueUSD
        cumulativeUniqueUsers
        totalPoolCount
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
      name
      type
      schemaVersion
      subgraphVersion
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
  };

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
