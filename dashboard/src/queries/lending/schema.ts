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
  const entities = ["financialsDailySnapshots", "usageMetricsDailySnapshots", "marketDailySnapshots"];
  
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
    marketDailySnapshots: {
      totalValueLockedUSD: "BigDecimal!",
      totalVolumeUSD: "BigDecimal!",
      inputTokenBalances: "[BigInt!]!",
      outputTokenSupply: "BigInt!",
      outputTokenPriceUSD: "BigDecimal!",
      rewardTokenEmissionsAmount: "[BigInt!]!",
      rewardTokenEmissionsUSD: "[BigDecimal!]!"
    }
  };

  const query = `
      {
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
        markets {
          id
          name
        }
        usageMetricsDailySnapshots(first: 500) {
          totalUniqueUsers
          dailyTransactionCount
          activeUsers
          timestamp
        }
        marketDailySnapshots(first:500, where: {market: $poolId}) {
          totalValueLockedUSD
          inputTokenBalances
          outputTokenSupply
          outputTokenPriceUSD
          rewardTokenEmissionsAmount
          rewardTokenEmissionsUSD
          totalVolumeUSD
          timestamp
        }
        market(id:$poolId){
          inputTokens{
            decimals
            name
          }
         
          rewardTokens{
            name
          }
         name
         isActive
         canUseAsCollateral
         canBorrowFrom
         maximumLTV
         liquidationThreshold
         liquidationPenalty
         depositRate
         stableBorrowRate
         variableBorrowRate
        }
         
        withdraws(first: 500, where: {market: $poolId}) {
          amountUSD
          amount
          blockNumber
          from
          timestamp
        }
        repays(first: 500, where: {market: $poolId}) {
          timestamp
          blockNumber
          from
          amount
          amountUSD
        }
        liquidates(first: 500, where: {market: $poolId}) {
          timestamp
          blockNumber
          from
          amount
          amountUSD
          profitUSD
        }
        deposits(first: 500, where: {market: $poolId}) {
          timestamp
          blockNumber
          from
          amount
          amountUSD
        }
        borrows(first: 500, where: {market: $poolId}) {
          timestamp
          blockNumber
          from
          amount
          amountUSD
        }
      }
    `;
  const poolData: {[x: string]: string} = {
    inputTokens: "[Token!]!",
    outputToken: "Token",
    rewardTokens: "[RewardToken!]",
    name: "String",
    isActive: "Boolean!",
    variableBorrowRate: "BigDecimal!",
    depositRate: "BigDecimal!",
    stableBorrowRate: "BigDecimal!",
    liquidationPenalty: "BigDecimal!",
    liquidationThreshold: "BigDecimal!",
    maximumLTV: "BigDecimal!",
    canBorrowFrom: "Boolean!",
    canUseAsCollateral: "Boolean!",
  };

  const protocolFields = {
    id: "ID!",
    name: "String!",
    slug: "String!",
    schemaVersion: "String!",
    subgraphVersion: "String!",
    network: "Network!",
    type: "ProtocolType!",
    riskType: "RiskType",
    lendingType: "LendingType",
    totalUniqueUsers: "Int!",
    totalValueLockedUSD: "BigDecimal!",
  };

  const events = ["withdraws","repays","liquidates","deposits","borrows"]
  return { entities, entitiesData, query, poolData, events, protocolFields};
};

export const schema110 = (): Schema => {
  const entities = ["financialsDailySnapshots", "usageMetricsDailySnapshots", "marketDailySnapshots"];
  
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
    marketDailySnapshots: {
      totalValueLockedUSD: "BigDecimal!",
      totalVolumeUSD: "BigDecimal!",
      inputTokenBalances: "[BigInt!]!",
      outputTokenSupply: "BigInt!",
      outputTokenPriceUSD: "BigDecimal!",
      rewardTokenEmissionsAmount: "[BigInt!]!",
      rewardTokenEmissionsUSD: "[BigDecimal!]!"
    }
  };

  const poolData: {[x: string]: string} = {
    inputTokens: "[Token!]!",
    outputToken: "Token",
    rewardTokens: "[RewardToken!]",
    name: "String",
    isActive: "Boolean!",
    variableBorrowRate: "BigDecimal!",
    depositRate: "BigDecimal!",
    stableBorrowRate: "BigDecimal!",
    liquidationPenalty: "BigDecimal!",
    liquidationThreshold: "BigDecimal!",
    maximumLTV: "BigDecimal!",
    canBorrowFrom: "Boolean!",
    canUseAsCollateral: "Boolean!",
  };
  const query = `
      query Data($poolId: String){
        protocols {
          name
          type
          schemaVersion
          subgraphVersion
        }
        markets {
          id
          name
        }
        financialsDailySnapshots(first: 500) {
          totalValueLockedUSD
          totalVolumeUSD
          protocolSideRevenueUSD
          supplySideRevenueUSD
          timestamp
        }
        usageMetricsDailySnapshots(first: 500) {
          totalUniqueUsers
          dailyTransactionCount
          activeUsers
          timestamp
        }
        marketDailySnapshots(first:500, market: $poolId) {
          totalValueLockedUSD
          inputTokenBalances
          outputTokenSupply
          outputTokenPriceUSD
          rewardTokenEmissionsAmount
          rewardTokenEmissionsUSD
          totalVolumeUSD
          timestamp
        }
        market(id:$poolId){
          inputTokens{
            decimals
            name
          }
          rewardTokens{
            name
          }
         name
         isActive
         canUseAsCollateral
         canBorrowFrom
         maximumLTV
         liquidationThreshold
         liquidationPenalty
         depositRate
         stableBorrowRate
         variableBorrowRate
        }
        
        withdraws(first: 500, where: {market: $poolId}) {
          amountUSD
          amount
          blockNumber
          from
          timestamp
        }
        repays(first: 500, where: {market: $poolId}) {
          timestamp
          blockNumber
          from
          amount
          amountUSD
        }
        liquidates(first: 500, where: {market: $poolId}) {
          timestamp
          blockNumber
          from
          amount
          amountUSD
          profitUSD
        }
        deposits(first: 500, where: {market: $poolId}) {
          timestamp
          blockNumber
          from
          amount
          amountUSD
        }
        borrows(first: 500, where: {market: $poolId}) {
          timestamp
          blockNumber
          from
          amount
          amountUSD
        }
      }
      `;

      const protocolFields = {
        id: "ID!",
        name: "String!",
        slug: "String!",
        schemaVersion: "String!",
        subgraphVersion: "String!",
        methodologyVersion: "String!",
        network: "Network!",
        type: "ProtocolType!",
        riskType: "RiskType",
        lendingType: "LendingType",
        totalUniqueUsers: "Int!",
        totalValueLockedUSD: "BigDecimal!",
        totalVolumeUSD: "BigDecimal!",
        totalDepositUSD: "BigDecimal!",
        totalBorrowUSD: "BigDecimal!"
      };
      

      const events = ["withdraws","repays","liquidates","deposits","borrows"];
      return { entities, entitiesData, query, poolData, events, protocolFields};
    };

export const schema120 = (): Schema => {
  const entities = [
    "financialsDailySnapshots",
    "usageMetricsDailySnapshots",
    "marketDailySnapshots",
    "usageMetricsHourlySnapshots",
    "marketHourlySnapshots"
  ];
  const entitiesData = {
    // Each Array within this array contains strings of the fields to pull for the entity type of the same index above
    financialsDailySnapshots: {
      totalValueLockedUSD: "BigDecimal!",
      protocolControlledValueUSD: "BigDecimal",
      mintedTokenSupplies: "[BigInt!]",
      dailySupplySideRevenueUSD: "BigDecimal!",
      cumulativeSupplySideRevenueUSD: "BigDecimal!",
      dailyProtocolSideRevenueUSD: "BigDecimal!",
      cumulativeProtocolSideRevenueUSD: "BigDecimal!",
      dailyTotalRevenueUSD: "BigDecimal!", 
      cumulativeTotalRevenueUSD: "BigDecimal!",
      dailyLiquidateUSD: "BigDecimal!",
      cumulativeLiquidateUSD: "BigDecimal!",
      timestamp: "BigInt!"
    },
    usageMetricsDailySnapshots: {
      dailyActiveUsers: "Int!",
      cumulativeUniqueUsers: "Int!",
      dailyTransactionCount: "Int!",
      dailyDepositCount: "Int!",
      dailyWithdrawCount: "Int!",
      dailyBorrowCount: "Int!",
      dailyRepayCount: "Int!",
      dailyLiquidateCount: "Int!",
      timestamp: "BigInt!"
    },
    marketDailySnapshots: {
      totalValueLockedUSD: "BigDecimal!",
      totalDepositBalanceUSD: "BigDecimal!",
      dailyDepositUSD: "BigDecimal!",
      cumulativeDepositUSD: "BigDecimal!",
      totalBorrowBalanceUSD: "BigDecimal!",
      dailyBorrowUSD: "BigDecimal!",
      cumulativeBorrowUSD: "BigDecimal!",
      dailyLiquidateUSD: "BigDecimal!",
      cumulativeLiquidateUSD: "BigDecimal!",
      inputTokenBalance: "BigInt!",
      inputTokenPriceUSD: "BigDecimal!",
      outputTokenSupply: "BigInt!",
      outputTokenPriceUSD: "BigDecimal!",
      exchangeRate: "BigDecimal",
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
      hourlyBorrowCount: "Int!",
      hourlyRepayCount: "Int!",
      hourlyLiquidateCount: "Int!",
      timestamp: "BigInt!"
    },
    marketHourlySnapshots: {
      totalValueLockedUSD: "BigDecimal!",
      totalDepositBalanceUSD: "BigDecimal!",
      hourlyDepositUSD: "BigDecimal!",
      cumulativeDepositUSD: "BigDecimal!",
      totalBorrowBalanceUSD: "BigDecimal!",
      hourlyBorrowUSD: "BigDecimal!",
      cumulativeBorrowUSD: "BigDecimal!",
      hourlyLiquidateUSD: "BigDecimal!",
      cumulativeLiquidateUSD: "BigDecimal!",
      inputTokenBalance: "BigInt!",
      inputTokenPriceUSD: "BigDecimal!",
      outputTokenSupply: "BigInt!",
      outputTokenPriceUSD: "BigDecimal!",
      exchangeRate: "BigDecimal",
      rewardTokenEmissionsAmount: "[BigInt!]",
      rewardTokenEmissionsUSD: "[BigDecimal!]",
      timestamp: "BigInt!"
    }
  };

  const finanQuery = "financialsDailySnapshots(first: 500) {" + Object.keys(entitiesData.financialsDailySnapshots).join(",") + '}';
  const usageDailyQuery = "usageMetricsDailySnapshots(first: 500) {" + Object.keys(entitiesData.usageMetricsDailySnapshots).join(',') + '}';
  const usageHourlyQuery = "usageMetricsHourlySnapshots(first: 500) {" + Object.keys(entitiesData.usageMetricsHourlySnapshots).join(',') + '}';

  const marketDailyQuery = "marketDailySnapshots(first: 500, where: {market: $poolId}) {" + Object.keys(entitiesData.marketDailySnapshots).join(',') + '}';
  const marketHourlyQuery = "marketHourlySnapshots(first: 500, where: {market: $poolId}) {" + Object.keys(entitiesData.marketHourlySnapshots).join(',') + '}';

  const eventsFields = [
    "hash",
    "to",
    "from",
    "timestamp",
    "amount",
    "amountUSD"
  ];

  const events: string[] = ["withdraws","repays","liquidates","deposits","borrows"];
  const eventsQuery: any[] = events.map((event) => {
    let options = "";
    const baseStr = event + "(first: 500, where: {market: $poolId}" + options + ") { "
    let fields = eventsFields.join(", ");
    if (event === "liquidates") {
      fields += ", profitUSD"
    }
    return baseStr + fields + ' }'
  });
  
  const poolData: {[x: string]: string} = {
    id: "ID!",
    name: "String",
    inputToken: "Token!",
    outputToken: "Token",
    rewardTokens: "[RewardToken!]",
    isActive: "Boolean!",
    canUseAsCollateral: "Boolean!",
    canBorrowFrom: "Boolean!",
    maximumLTV: "BigDecimal!",
    liquidationThreshold: "BigDecimal!",
    liquidationPenalty: "BigDecimal!",
    totalValueLockedUSD: "BigDecimal!",
    totalDepositBalanceUSD: "BigDecimal!",
    cumulativeDepositUSD: "BigDecimal!",
    totalBorrowBalanceUSD: "BigDecimal!",
    cumulativeBorrowUSD: "BigDecimal!",
    cumulativeLiquidateUSD: "BigDecimal!",
    inputTokenBalance: "BigInt!",
    inputTokenPriceUSD: "BigDecimal!",
    outputTokenSupply: "BigInt!",
    outputTokenPriceUSD: "BigDecimal!",
    exchangeRate: "BigDecimal",
    rewardTokenEmissionsAmount: "[BigInt!]",
    rewardTokenEmissionsUSD: "[BigDecimal!]"
  };

  const query = `
  query Data($poolId: String){
    protocols {
      id
      name
      type
      schemaVersion
      subgraphVersion
    }
    markets {
      id
      name
    }
    ${finanQuery}
    ${usageHourlyQuery}
    ${usageDailyQuery}
    ${marketHourlyQuery}
    ${marketDailyQuery}
    ${eventsQuery}
    market(id:$poolId){
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
    lendingType: "LendingType",
    riskType: "RiskType",
    mintedTokens: "[Token!]",
    cumulativeUniqueUsers: "Int!",
    totalValueLockedUSD: "BigDecimal!",
    protocolControlledValueUSD: "BigDecimal",
    cumulativeSupplySideRevenueUSD: "BigDecimal!",
    cumulativeProtocolSideRevenueUSD: "BigDecimal!",
    cumulativeTotalRevenueUSD: "BigDecimal!",
    totalDepositBalanceUSD: "BigDecimal!",
    cumulativeDepositUSD: "BigDecimal!",
    totalBorrowBalanceUSD: "BigDecimal!",
    cumulativeBorrowUSD: "BigDecimal!",
    cumulativeLiquidateUSD: "BigDecimal!",
    mintedTokenSupplies: "[BigInt!]"
  };  

  return { entities, entitiesData, query, poolData ,events, protocolFields};
};

