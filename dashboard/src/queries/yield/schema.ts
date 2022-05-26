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
    default:
      return schema120();
  }
};

export const poolFields = {
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
  cumulativeSupplySideRevenueUSD: "BigDecimal!",
  cumulativeProtocolSideRevenueUSD: "BigDecimal!",
  cumulativeTotalRevenueUSD: "BigDecimal!",
  cumulativeUniqueUsers: "Int!",
};

export const schema100 = (): Schema => {
  const entities = ["financialsDailySnapshots", "usageMetricsDailySnapshots", "vaultDailySnapshots"];
  const entitiesData = {
    // Each Array within this array contains strings of the fields to pull for the entity type of the same index above
    financialsDailySnapshots: {
      totalValueLockedUSD: "BigDecimal!",
      totalVolumeUSD: "BigDecimal!",
      protocolSideRevenueUSD: "BigDecimal!",
      supplySideRevenueUSD: "BigDecimal!",
      feesUSD: "BigDecimal",
    },
    usageMetricsDailySnapshots: {
      totalUniqueUsers: "Int!",
      dailyTransactionCount: "Int!",
      activeUsers: "Int!",
    },
    vaultDailySnapshots: {
      totalVolumeUSD: "BigDecimal!",
      inputTokenBalances: "[BigInt!]!",
      outputTokenSupply: "BigInt!",
      outputTokenPriceUSD: "BigDecimal",
      rewardTokenEmissionsAmount: "[BigInt!]",
      rewardTokenEmissionsUSD: "[BigDecimal!]",
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
        yieldAggregator(id: $protocolId) {
          id
          name
          slug
          schemaVersion
          subgraphVersion
          network
          type
          totalValueLockedUSD
          totalUniqueUsers
        }
        yieldAggregators {
          id
          name
          slug
          schemaVersion
          subgraphVersion
          network
          type
          totalValueLockedUSD
          totalUniqueUsers
        }
        financialsDailySnapshots(first: 1000, orderBy: timestamp, orderDirection: desc) {
          totalValueLockedUSD
          totalVolumeUSD
          protocolSideRevenueUSD
          supplySideRevenueUSD
          feesUSD
          timestamp
        }
        vaults {
          id
          name
          fees{
            feePercentage
            feeType
          }
          inputTokens {
            name
            decimals
          }
          outputToken {
            id
            decimals
          }
          rewardTokens {
            id
            decimals
          }
          symbol
          depositLimit
          rewardTokenEmissionsAmount
          rewardTokenEmissionsUSD
        }
        usageMetricsDailySnapshots(first: 1000, orderBy: timestamp, orderDirection: desc) {
          totalUniqueUsers
          dailyTransactionCount
          activeUsers
          timestamp
        }
        vaultDailySnapshots(first:1000, orderBy: timestamp, orderDirection: desc, where: {vault: $poolId}) {
          totalValueLockedUSD
          inputTokenBalances
          outputTokenSupply
          outputTokenPriceUSD
          rewardTokenEmissionsAmount
          rewardTokenEmissionsUSD
          totalVolumeUSD
          timestamp
        }
        vault(id: $poolId){
          id
          name
          fees{
            feePercentage
            feeType
          }
          inputTokens {
            name
            decimals
          }
          outputToken {
            id
            decimals
          }
          rewardTokens {
            id
            decimals
          }
          symbol
          depositLimit
          rewardTokenEmissionsAmount
          rewardTokenEmissionsUSD
        }
        withdraws(first: 1000, orderBy: timestamp, orderDirection: desc, where: {vault: $poolId}) {
          amountUSD
          amount
          blockNumber
          from
          timestamp
        }
        deposits(first: 1000, orderBy: timestamp, orderDirection: desc, where: {vault: $poolId}) {
          timestamp
          blockNumber
          from
          amount
          amountUSD
        }
      }
    `;

  const poolData = {
    id: "ID!",
    name: "String",
    symbol: "String",
    fees: "[VaultFee!]!",
    depositLimit: "BigInt!",
    inputTokens: "Token!",
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
    totalValueLockedUSD: "BigDecimal!",
    totalUniqueUsers: "Int!",
  };

  const events = ["withdraws", "deposits"];

  return { entities, entitiesData, query, poolData, events, protocolFields };
};

export const schema110 = (): Schema => {
  const entities = ["financialsDailySnapshots", "usageMetricsDailySnapshots", "vaultDailySnapshots"];

  const entitiesData = {
    // Each Array within this array contains strings of the fields to pull for the entity type of the same index above
    financialsDailySnapshots: {
      totalValueLockedUSD: "BigDecimal!",
      totalVolumeUSD: "BigDecimal!",
      protocolSideRevenueUSD: "BigDecimal!",
      supplySideRevenueUSD: "BigDecimal!",
      totalRevenueUSD: "BigDecimal",
    },
    usageMetricsDailySnapshots: {
      totalUniqueUsers: "Int!",
      dailyTransactionCount: "Int!",
      activeUsers: "Int!",
    },
    vaultDailySnapshots: {
      totalValueLockedUSD: "BigDecimal!",
      totalVolumeUSD: "BigDecimal!",
      inputTokenBalances: "[BigInt!]!",
      outputTokenSupply: "BigInt!",
      outputTokenPriceUSD: "BigDecimal",
      rewardTokenEmissionsAmount: "[BigInt!]",
      rewardTokenEmissionsUSD: "[BigDecimal!]",
      timestamp: "BigInt!",
    },
  };

  const events = ["withdraws", "deposits"];

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
        yieldAggregator(id: $protocolId){
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
        yieldAggregators {
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
        vaults {
          id
          name
          fees{
            feePercentage
            feeType
          }
          inputTokens {
            name
            decimals
          }
          outputToken {
            id
            decimals
          }
          rewardTokens {
            id
            decimals
          }
          symbol
          depositLimit
          rewardTokenEmissionsAmount
          rewardTokenEmissionsUSD
        }
        usageMetricsDailySnapshots(first: 1000, orderBy: timestamp, orderDirection: desc) {
          totalUniqueUsers
          dailyTransactionCount
          activeUsers
          timestamp
        }
        vaultDailySnapshots(first:1000, orderBy: timestamp, orderDirection: desc, where: {vault: $poolId}) {
          totalValueLockedUSD
          inputTokenBalances
          outputTokenSupply
          outputTokenPriceUSD
          rewardTokenEmissionsAmount
          rewardTokenEmissionsUSD
          totalVolumeUSD
          timestamp
        }
        vault(id: $poolId){
          id
          name
          fees{
            feePercentage
            feeType
          }
          inputTokens {
            name
            decimals
          }
          outputToken {
            id
            decimals
          }
          rewardTokens {
            id
            decimals
          }
          symbol
          depositLimit
          rewardTokenEmissionsAmount
          rewardTokenEmissionsUSD
        }
        withdraws(first: 1000, orderBy: timestamp, orderDirection: desc, where: {vault: $poolId}) {
          amountUSD
          amount
          blockNumber
          from
          timestamp
        }
        deposits(first: 1000, orderBy: timestamp, orderDirection: desc, where: {vault: $poolId}) {
          timestamp
          blockNumber
          from
          amount
          amountUSD
        }

      }
      `;

  const poolData = {
    id: "ID!",
    name: "String",
    symbol: "String",
    fees: "[VaultFee!]!",
    depositLimit: "BigInt!",
    inputTokens: "Token!",
    outputToken: "Token",
    rewardTokens: "[RewardToken!]",
  };

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

  return { entities, entitiesData, query, poolData, events, protocolFields };
};

export const schema120 = (): Schema => {
  const entities = [
    "financialsDailySnapshots",
    "usageMetricsDailySnapshots",
    "vaultDailySnapshots",
    "usageMetricsHourlySnapshots",
    "vaultHourlySnapshots",
  ];
  const entitiesData = {
    // Each Array within this array contains strings of the fields to pull for the entity type of the same index above
    financialsDailySnapshots: {
      id: "ID!",
      totalValueLockedUSD: "BigDecimal!",
      protocolControlledValueUSD: "BigDecimal",
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
      dailyActiveUsers: "Int!",
      cumulativeUniqueUsers: "Int!",
      dailyTransactionCount: "Int!",
      dailyDepositCount: "Int!",
      dailyWithdrawCount: "Int!",
      timestamp: "BigInt!",
    },
    vaultDailySnapshots: {
      id: "ID!",
      totalValueLockedUSD: "BigDecimal!",
      inputTokenBalance: "BigInt!",
      outputTokenSupply: "BigInt!",
      outputTokenPriceUSD: "BigDecimal",
      stakedOutputTokenAmount: "BigInt",
      pricePerShare: "BigDecimal",
      rewardTokenEmissionsAmount: "[BigInt!]",
      rewardTokenEmissionsUSD: "[BigDecimal!]",
      timestamp: "BigInt!",
    },
    usageMetricsHourlySnapshots: {
      id: "ID!",
      hourlyActiveUsers: "Int!",
      cumulativeUniqueUsers: "Int!",
      hourlyTransactionCount: "Int!",
      hourlyDepositCount: "Int!",
      hourlyWithdrawCount: "Int!",
      timestamp: "BigInt!",
    },
    vaultHourlySnapshots: {
      id: "ID!",
      totalValueLockedUSD: "BigDecimal!",
      inputTokenBalance: "BigInt!",
      outputTokenSupply: "BigInt!",
      outputTokenPriceUSD: "BigDecimal",
      stakedOutputTokenAmount: "BigInt",
      pricePerShare: "BigDecimal",
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

  const vaultDailyQuery =
    "vaultDailySnapshots(first: 1000, orderBy: timestamp, orderDirection: desc, where: {vault: $poolId}) {" +
    Object.keys(entitiesData.vaultDailySnapshots).join(",") +
    "}";
  const vaultHourlyQuery =
    "vaultHourlySnapshots(first: 1000, orderBy: timestamp, orderDirection: desc, where: {vault: $poolId}) {" +
    Object.keys(entitiesData.vaultHourlySnapshots).join(",") +
    "}";

  const events = ["withdraws", "deposits"];
  const eventsFields = ["hash", "to", "from", "timestamp", "amount", "amountUSD"];
  const eventsQuery = events.map((event) => {
    let options = "";
    const baseStr =
      event + "(first: 1000, orderBy: timestamp, orderDirection: desc, where: {vault: $poolId}" + options + ") { ";
    const fields = eventsFields.join(", ");
    return baseStr + fields + " }";
  });

  const poolData = {
    id: "ID!",
    name: "String",
    symbol: "String",
    fees: "[VaultFee!]!",
    depositLimit: "BigInt!",
    inputToken: "Token!",
    outputToken: "Token",
    rewardTokens: "[RewardToken!]",
    totalValueLockedUSD: "BigDecimal!",
    inputTokenBalance: "BigInt!",
    outputTokenSupply: "BigInt",
    outputTokenPriceUSD: "BigDecimal",
    rewardTokenEmissionsAmount: "[BigInt!]",
    rewardTokenEmissionsUSD: "[BigDecimal!]",
    stakedOutputTokenAmount: "BigInt",
    pricePerShare: "BigDecimal",
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
        id
        methodologyVersion
        name
        type
        schemaVersion
        subgraphVersion
      }
      yieldAggregator(id: $protocolId) {
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
        cumulativeSupplySideRevenueUSD
        cumulativeProtocolSideRevenueUSD
        cumulativeTotalRevenueUSD
        cumulativeUniqueUsers
      }
      yieldAggregators {
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
        cumulativeSupplySideRevenueUSD
        cumulativeProtocolSideRevenueUSD
        cumulativeTotalRevenueUSD
        cumulativeUniqueUsers
      }
      vaults {
        id
        name
        symbol
        fees {
          feeType
          feePercentage
        }
        inputToken {
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
        depositLimit
        totalValueLockedUSD
        stakedOutputTokenAmount
        pricePerShare
        inputTokenBalance
        outputTokenSupply
        outputTokenPriceUSD
        rewardTokenEmissionsAmount
        rewardTokenEmissionsUSD
      }
      ${finanQuery}
      ${usageHourlyQuery}
      ${usageDailyQuery}
      ${vaultHourlyQuery}
      ${vaultDailyQuery}
      ${eventsQuery}
      vault(id:$poolId){
        id
        name        
        symbol
        fees {
          feeType
          feePercentage
        }
        inputToken {
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
        depositLimit
        totalValueLockedUSD
        stakedOutputTokenAmount
        pricePerShare
        inputTokenBalance
        outputTokenSupply
        outputTokenPriceUSD
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
    cumulativeSupplySideRevenueUSD: "BigDecimal!",
    cumulativeProtocolSideRevenueUSD: "BigDecimal!",
    cumulativeTotalRevenueUSD: "BigDecimal!",
    cumulativeUniqueUsers: "Int!",
  };

  return { entities, entitiesData, query, poolData, events, protocolFields };
};
