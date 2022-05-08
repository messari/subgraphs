import { Schema, Versions } from "../../constants";

export const schema = (version: string): Schema => {
  // The version group uses the first two digits  of the schema version and defaults to that schema.
  const versionGroupArr = version.split('.');
  versionGroupArr.pop();
  const versionGroup = versionGroupArr.join('.') + '.0';
  switch (versionGroup) {
    case Versions.Schema100:
      return schema100();
    case Versions.Schema110:
      return schema110();
    case Versions.Schema120:
      return schema120();
    default:
      return schema120();
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
      feesUSD: "BigDecimal!"
    },
    usageMetricsDailySnapshots: {
      totalUniqueUsers: "Int!",
      dailyTransactionCount: "Int!",
      activeUsers: "Int!"
    },
    liquidityPoolDailySnapshots: {
      totalValueLockedUSD: "BigDecimal!",
      totalVolumeUSD: "BigDecimal!",
      inputTokenBalances: "[BigInt!]!",
      outputTokenSupply: "BigInt!",
      outputTokenPriceUSD: "BigDecimal!",
      rewardTokenEmissionsAmount: "[BigInt!]!",
      rewardTokenEmissionsUSD: "[BigDecimal!]!",
      timestamp: "BigInt!"
    }
  };
  const query = `
      query Data($poolId: String){
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
        dexAmmProtocols {
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
        liquidityPools {
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
        liquidityPool(id: $poolId){
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
    fees: "[LiquidityPoolFee!]!",
    inputTokens: "[Token!]!",
    outputToken: "Token",
    rewardTokens: "[RewardToken!]"
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

  const events = ["withdraws","deposits","swaps"];
  return { entities, entitiesData, query, poolData ,events, protocolFields};
};

export const schema110 = (): Schema => {
  const entities = ["financialsDailySnapshots", "usageMetricsDailySnapshots", "poolDailySnapshots"];

  const entitiesData = {
    financialsDailySnapshots: {
      totalValueLockedUSD: "BigDecimal!",
      totalVolumeUSD: "BigDecimal!",
      protocolSideRevenueUSD: "BigDecimal!",
      supplySideRevenueUSD: "BigDecimal!",
      totalRevenueUSD: "BigDecimal!"
    },
    usageMetricsDailySnapshots: {
      totalUniqueUsers: "Int!",
      dailyTransactionCount: "Int!",
      activeUsers: "Int!"
    },
    liquidityPoolDailySnapshots: {
      totalValueLockedUSD: "BigDecimal!",
      totalVolumeUSD: "BigDecimal!",
      inputTokenBalances: "[BigInt!]!",
      outputTokenSupply: "BigInt!",
      outputTokenPriceUSD: "BigDecimal!",
      rewardTokenEmissionsAmount: "[BigInt!]!",
      rewardTokenEmissionsUSD: "[BigDecimal!]!",
      timestamp: "BigInt!"
    }
  };
  const query = `
      query Data($poolId: String){
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
        dexAmmProtocols {
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
        liquidityPools {
          id
          name
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
        liquidityPool(id: $poolId){
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
    fees: "[LiquidityPoolFee!]!",
    inputTokens: "[Token!]!",
    outputToken: "Token",
    rewardTokens: "[RewardToken!]"
  };

  const events = ["withdraws","deposits","swaps"];

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
    totalVolumeUSD: "BigDecimal!"
  };

  return { entities, entitiesData, query, poolData ,events, protocolFields};
};

export const schema120 = (): Schema => {
  const entities = [
    "financialsDailySnapshots",
    "usageMetricsDailySnapshots",
    "liquidityPoolDailySnapshots",
    "usageMetricsHourlySnapshots",
    "liquidityPoolHourlySnapshots"
  ];

  const entitiesData = {
    financialsDailySnapshots: {
      totalValueLockedUSD: "BigDecimal!",
      protocolControlledValueUSD: "BigDecimal",
      dailyVolumeUSD: "BigDecimal!",
      cumulativeVolumeUSD: "BigDecimal!",
      dailySupplySideRevenueUSD: "BigDecimal!",
      cumulativeSupplySideRevenueUSD: "BigDecimal!",
      dailyProtocolSideRevenueUSD: "BigDecimal!",
      cumulativeProtocolSideRevenueUSD: "BigDecimal!",
      dailyTotalRevenueUSD: "BigDecimal!", 
      cumulativeTotalRevenueUSD: "BigDecimal!",
      timestamp: "BigInt!"
    },
    usageMetricsDailySnapshots: {
      dailyActiveUsers: "Int!",
      cumulativeUniqueUsers: "Int!",
      dailyTransactionCount: "Int!",
      dailyDepositCount: "Int!",
      dailyWithdrawCount: "Int!",
      dailySwapCount: "Int!",
      timestamp: "BigInt!"
    },
    liquidityPoolDailySnapshots: {
      totalValueLockedUSD: "BigDecimal!",
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
      timestamp: "BigInt!"
    },
    usageMetricsHourlySnapshots: {
      hourlyActiveUsers: "Int!",
      cumulativeUniqueUsers: "Int!",
      hourlyTransactionCount: "Int!",
      hourlyDepositCount: "Int!",
      hourlyWithdrawCount: "Int!",
      hourlySwapCount: "Int!",
      timestamp: "BigInt!"
    },
    liquidityPoolHourlySnapshots: {
      totalValueLockedUSD: "BigDecimal!",
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
      timestamp: "BigInt!"
    }
  };
  
  const finanQuery = "financialsDailySnapshots(first: 1000, orderBy: timestamp, orderDirection: desc) {" + Object.keys(entitiesData.financialsDailySnapshots).join(",") + '}';
  const usageDailyQuery = "usageMetricsDailySnapshots(first: 1000, orderBy: timestamp, orderDirection: desc) {" + Object.keys(entitiesData.usageMetricsDailySnapshots).join(',') + '}';
  const usageHourlyQuery = "usageMetricsHourlySnapshots(first: 1000, orderBy: timestamp, orderDirection: desc) {" + Object.keys(entitiesData.usageMetricsHourlySnapshots).join(',') + '}';

  const liquidityPoolDailyQuery = "liquidityPoolDailySnapshots(first: 1000, orderBy: timestamp, orderDirection: desc, where: {pool: $poolId}) {" + Object.keys(entitiesData.liquidityPoolDailySnapshots).join(',') + '}';
  const liquidityPoolHourlyQuery = "liquidityPoolHourlySnapshots(first: 1000, orderBy: timestamp, orderDirection: desc, where: {pool: $poolId}) {" + Object.keys(entitiesData.liquidityPoolHourlySnapshots).join(',') + '}';

  const eventsFields = [
    "timestamp",
    "blockNumber",
    "from"
  ];

  const poolData: {[x: string]: string} = {
    id: "ID!",
    name: "String",
    symbol: "String",
    fees: "[LiquidityPoolFee!]!",
    inputTokens: "[Token!]!",
    outputToken: "Token",
    rewardTokens: "[RewardToken!]",
    totalValueLockedUSD: "BigDecimal!",
    cumulativeVolumeUSD: "BigDecimal!",
    inputTokenBalances: "[BigInt!]!",
    inputTokenWeights: "[BigDecimal!]!",
    outputTokenSupply: "BigInt",
    outputTokenPriceUSD: "BigDecimal",
    stakedOutputTokenAmount: "BigInt",
    rewardTokenEmissionsAmount: "[BigInt!]",
    rewardTokenEmissionsUSD: "[BigDecimal!]"
  };

  // Query liquidityPool(pool) entity and events entities
  let events: string[] = ["withdraws","deposits","swaps"];
  let eventsQuery: any[] = events.map((event) => {
    let options = "";
    const baseStr = event + "(first: 1000, orderBy: timestamp, orderDirection: desc, where: {pool: $poolId}" + options + ") { "
    let fields = eventsFields.join(",");
    if (event === "swaps") {
      fields += ", amountIn, amountInUSD, amountOutUSD, amountOut";
    } else {
      fields += ', amountUSD';
    }
    return baseStr + fields + ' }'
  });
  
  let query = `
  query Data($poolId: String){
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
    dexAmmProtocols {
      id
      name
      slug
      schemaVersion
      subgraphVersion
      methodologyVersion
      network
      type
      totalValueLockedUSD
      protocolControlledValueUSD
      cumulativeVolumeUSD
      cumulativeSupplySideRevenueUSD
      cumulativeProtocolSideRevenueUSD
      cumulativeTotalRevenueUSD
      cumulativeUniqueUsers
    }
    liquidityPools {
      id
      name
    }
    ${finanQuery}
    ${usageHourlyQuery}
    ${usageDailyQuery}
    ${liquidityPoolDailyQuery}
    ${liquidityPoolHourlyQuery}
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
        decimals
        name
      }
      outputToken {
        id
        decimals
      }
      rewardTokens {
        id
        token {
          decimals
        }
      }
      totalValueLockedUSD
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
    protocolControlledValueUSD: "BigDecimal",
    cumulativeVolumeUSD: "BigDecimal!",
    cumulativeSupplySideRevenueUSD: "BigDecimal!",
    cumulativeProtocolSideRevenueUSD: "BigDecimal!",
    cumulativeTotalRevenueUSD: "BigDecimal!",
    cumulativeUniqueUsers: "Int!"
  };

  return { entities, entitiesData, query, poolData, events, protocolFields};
};
 