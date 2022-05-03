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
  cumulativeUniqueUsers: "Int!"
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
      feesUSD: "BigDecimal"
    },
    usageMetricsDailySnapshots: {
      totalUniqueUsers: "Int!",
      dailyTransactionCount: "Int!",
      activeUsers: "Int!"
    },
    vaultDailySnapshots: {
      totalVolumeUSD: "BigDecimal!",
      inputTokenBalances: "[BigInt!]!",
      outputTokenSupply: "BigInt!",
      outputTokenPriceUSD: "BigDecimal",
      rewardTokenEmissionsAmount: "[BigInt!]",
      rewardTokenEmissionsUSD: "[BigDecimal!]",
    }
  };

  const query = `
  query Data($poolId: String){
        protocols {
          name
          type
          schemaVersion
          subgraphVersion
        }
        financialsDailySnapshots(first: 500) {
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
        }
        usageMetricsDailySnapshots(first: 500) {
          totalUniqueUsers
          dailyTransactionCount
          activeUsers
          timestamp
        }
        vaultDailySnapshots(first:500, where: {vault: $poolId}) {
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
          fees{
            feePercentage
            feeType
          }
          inputTokens {
            name
          }
          outputToken {
            name
          }
          rewardTokens {
            name
          }
          name
          symbol
          depositLimit
        }
        withdraws(first: 500, where: {vault: $poolId}) {
          amountUSD
          amount
          blockNumber
          from
          timestamp
        }
        deposits(first: 500, where: {vault: $poolId}) {
          timestamp
          blockNumber
          from
          amount
          amountUSD
        }
      }
    `;

  const poolData = {
    name: "String",
    symbol: "String",
    fees: "[VaultFee!]!",
    depositLimit: "BigInt!",
    inputTokens: "Token!",
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
    totalValueLockedUSD: "BigDecimal!",
    totalUniqueUsers: "Int!"
  };

  const events = ["withdraws","deposits"]
  
  return { entities, entitiesData, query, poolData, events, protocolFields};
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
      totalRevenueUSD: "BigDecimal"
    },
    usageMetricsDailySnapshots: {
      totalUniqueUsers: "Int!",
      dailyTransactionCount: "Int!",
      activeUsers: "Int!"
    },
    vaultDailySnapshots: {
      totalValueLockedUSD: "BigDecimal!",
      totalVolumeUSD: "BigDecimal!",
      inputTokenBalances: "[BigInt!]!",
      outputTokenSupply: "BigInt!",
      outputTokenPriceUSD: "BigDecimal",
      rewardTokenEmissionsAmount: "[BigInt!]",
      rewardTokenEmissionsUSD: "[BigDecimal!]",
      timestamp: "BigInt!"
    }
  };

  const events = ["withdraws","deposits"];

  const query = `
      query Data($poolId: String){
        protocols {
          name
          type
          schemaVersion
          subgraphVersion
        }
        financialsDailySnapshots(first: 500) {
          totalValueLockedUSD
          totalVolumeUSD
          protocolSideRevenueUSD
          supplySideRevenueUSD
          timestamp
        }
        vaults {
          id
          name
        }
        usageMetricsDailySnapshots(first: 500) {
          totalUniqueUsers
          dailyTransactionCount
          activeUsers
          timestamp
        }
        vaultDailySnapshots(first:500, where: {vault: $poolId}) {
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
          fees{
            feePercentage
            feeType
          }
          inputTokens {
            name
          }
          outputToken {
            name
          }
          rewardTokens {
            name
          }
          name
          symbol
          depositLimit
        }
        withdraws(first: 500, where: {vault: $poolId}) {
          amountUSD
          amount
          blockNumber
          from
          timestamp
        }
        deposits(first: 500, where: {vault: $poolId}) {
          timestamp
          blockNumber
          from
          amount
          amountUSD
        }

      }
      `;

  const poolData = {
    name: "String",
    symbol: "String",
    fees: "[VaultFee!]!",
    depositLimit: "BigInt!",
    inputTokens: "Token!",
    outputToken: "Token",
    rewardTokens: "[RewardToken!]"
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


  return { entities, entitiesData, query, poolData ,events, protocolFields};
};

export const schema120 = (): Schema => {
  const entities = [
    "financialsDailySnapshots",
    "usageMetricsDailySnapshots",
    "vaultDailySnapshots",
    "usageMetricsHourlySnapshots",
    "vaultHourlySnapshots"
  ];
  const entitiesData = {
    // Each Array within this array contains strings of the fields to pull for the entity type of the same index above
    financialsDailySnapshots: {
      totalValueLockedUSD: "BigDecimal!",
      protocolControlledValueUSD: "BigDecimal",
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
      timestamp: "BigInt!"
    },
    vaultDailySnapshots: {
      totalValueLockedUSD: "BigDecimal!",
      inputTokenBalance: "BigInt!",
      outputTokenSupply: "BigInt!",
      outputTokenPriceUSD: "BigDecimal",
      pricePerShare: "BigDecimal",
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
      timestamp: "BigInt!"
    },
    vaultHourlySnapshots: {
      totalValueLockedUSD: "BigDecimal!",
      inputTokenBalance: "BigInt!",
      outputTokenSupply: "BigInt!",
      outputTokenPriceUSD: "BigDecimal",
      pricePerShare: "BigDecimal",
      stakedOutputTokenAmount: "BigInt",
      rewardTokenEmissionsAmount: "[BigInt!]",
      rewardTokenEmissionsUSD: "[BigDecimal!]",
      timestamp: "BigInt!"
    }
  };


  const finanQuery = "financialsDailySnapshots(first: 500) {" + Object.keys(entitiesData.financialsDailySnapshots).join(",") + '}';
  const usageDailyQuery = "usageMetricsDaiflySnapshots(first: 500) {" + Object.keys(entitiesData.usageMetricsDailySnapshots).join(',') + '}';
  const usageHourlyQuery = "usageMetricsHourlySnapshots(first: 500) {" + Object.keys(entitiesData.usageMetricsHourlySnapshots).join(',') + '}';

  const vaultDailyQuery = "vaultDailySnapshots(first: 500, where: {vault: $poolId}) {" + Object.keys(entitiesData.vaultDailySnapshots).join(',') + '}';
  const vaultHourlyQuery = "vaultHourlySnapshots(first: 500, where: {vault: $poolId}) {" + Object.keys(entitiesData.vaultHourlySnapshots).join(',') + '}';


  const events = ["withdraws","deposits"];
  const eventsFields = [
    "hash",
    "to",
    "from",
    "timestamp",
    "amount",
    "amountUSD"
  ];
  const eventsQuery = events.map((event) => {
    let options = "";
    const baseStr = event + "(first: 500, where: {vault: $poolId}" + options + ") { "
    const fields = eventsFields.join(", ");
    return baseStr + fields + ' }'
  });

  const poolData = {
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
    pricePerShare: "BigDecimal"
  };
  
  const query = `
    query Data($poolId: String){
      protocols {
        name
        type
        schemaVersion
        subgraphVersion
      }
      vaults {
        id
        name
      }
      ${finanQuery}
      ${usageHourlyQuery}
      ${usageDailyQuery}
      ${vaultHourlyQuery}
      ${vaultDailyQuery}
      ${eventsQuery}
      vault(id:$poolId){
        inputToken {
          decimals
          name
        }

        outputToken {
          name
        }

        name
        isActive
        canUseAsCollateral
        canBorrowFrom
        maximumLTV
        liquidationThreshold
        liquidationPenalty
        totalValueLockedUSD
        totalDepositBalanceUSD
        cumulativeDepositUSD
        totalBorrowBalanceUSD
        cumulativeBorrowUSD
        cumulativeLiquidateUSD
        inputTokenBalance
        inputTokenPriceUSD
        outputTokenSupply
        outputTokenPriceUSD
        exchangeRate
        rewardTokenEmissionsAmount
        rewardTokenEmissionsUSD
      }
    }`

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
      cumulativeUniqueUsers: "Int!"
    };

  return { entities, entitiesData, query, poolData , events, protocolFields};
};
