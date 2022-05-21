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

export const schema100 = (): Schema => {
  const entities = ["financialsDailySnapshots", "usageMetricsDailySnapshots", "marketDailySnapshots"];

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
    marketDailySnapshots: {
      totalValueLockedUSD: "BigDecimal!",
      totalVolumeUSD: "BigDecimal!",
      inputTokenBalances: "[BigInt!]!",
      outputTokenSupply: "BigInt!",
      outputTokenPriceUSD: "BigDecimal!",
      rewardTokenEmissionsAmount: "[BigInt!]!",
      rewardTokenEmissionsUSD: "[BigDecimal!]!",
    },
  };

  const query = `
      {
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
        lendingProtocols {
          id
          name
          slug
          schemaVersion
          subgraphVersion
          network
          type
          riskType
          lendingType
          totalUniqueUsers
          totalValueLockedUSD
        }
        financialsDailySnapshots(first: 1000, orderBy: timestamp, orderDirection: desc) {
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
        usageMetricsDailySnapshots(first: 1000, orderBy: timestamp, orderDirection: desc) {
          totalUniqueUsers
          dailyTransactionCount
          activeUsers
          timestamp
        }
        marketDailySnapshots(first:1000, orderBy: timestamp, orderDirection: desc, where: {market: $poolId}) {
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
          outputToken {
            id
          }
         
          rewardTokens{
            id
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
         rewardTokenEmissionsAmount
         rewardTokenEmissionsUSD
        }
         
        withdraws(first: 1000, orderBy: timestamp, orderDirection: desc, where: {market: $poolId}) {
          amountUSD
          amount
          blockNumber
          from
          timestamp
        }
        repays(first: 1000, orderBy: timestamp, orderDirection: desc, where: {market: $poolId}) {
          timestamp
          blockNumber
          from
          amount
          amountUSD
        }
        liquidates(first: 1000, orderBy: timestamp, orderDirection: desc, where: {market: $poolId}) {
          timestamp
          blockNumber
          from
          amount
          amountUSD
          profitUSD
        }
        deposits(first: 1000, orderBy: timestamp, orderDirection: desc, where: {market: $poolId}) {
          timestamp
          blockNumber
          from
          amount
          amountUSD
        }
        borrows(first: 1000, orderBy: timestamp, orderDirection: desc, where: {market: $poolId}) {
          timestamp
          blockNumber
          from
          amount
          amountUSD
        }
      }
    `;
  const poolData: { [x: string]: string } = {
    id: "ID!",
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

  const events = ["withdraws", "repays", "liquidates", "deposits", "borrows"];
  return { entities, entitiesData, query, poolData, events, protocolFields };
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
      totalRevenueUSD: "BigDecimal",
    },
    usageMetricsDailySnapshots: {
      totalUniqueUsers: "Int!",
      dailyTransactionCount: "Int!",
      activeUsers: "Int!",
    },
    marketDailySnapshots: {
      totalValueLockedUSD: "BigDecimal!",
      totalVolumeUSD: "BigDecimal!",
      inputTokenBalances: "[BigInt!]!",
      outputTokenSupply: "BigInt!",
      outputTokenPriceUSD: "BigDecimal!",
      rewardTokenEmissionsAmount: "[BigInt!]!",
      rewardTokenEmissionsUSD: "[BigDecimal!]!",
    },
  };

  const poolData: { [x: string]: string } = {
    id: "ID!",
    name: "String",
    inputTokens: "[Token!]!",
    outputToken: "Token",
    rewardTokens: "[RewardToken!]",
    inputTokenBalances: "[BigInt!]!",
    outputTokenSupply: "BigInt!",
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
        lendingProtocols {
          id
          name,
          slug,
          schemaVersion,
          subgraphVersion,
          methodologyVersion,
          network,
          type,
          riskType,
          lendingType,
          totalUniqueUsers,
          totalValueLockedUSD,
          totalVolumeUSD,
          totalDepositUSD,
          totalBorrowUSD
        }
        markets {
          id
          name
        }
        financialsDailySnapshots(first: 1000, orderBy: timestamp, orderDirection: desc) {
          totalValueLockedUSD
          totalVolumeUSD
          protocolSideRevenueUSD
          supplySideRevenueUSD
          timestamp
        }
        usageMetricsDailySnapshots(first: 1000, orderBy: timestamp, orderDirection: desc) {
          totalUniqueUsers
          dailyTransactionCount
          activeUsers
          timestamp
        }
        marketDailySnapshots(first:1000, orderBy: timestamp, orderDirection: desc, where: {market: $poolId}) {
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
          id
          name
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
          rewardTokens{
            id
            decimals
            name
            symbol
          }
          inputTokenBalances
          outputTokenSupply
         isActive
         canUseAsCollateral
         canBorrowFrom
         maximumLTV
         liquidationThreshold
         liquidationPenalty
         depositRate
         stableBorrowRate
         variableBorrowRate
         rewardTokenEmissionsAmount
         rewardTokenEmissionsUSD
        }
        
        withdraws(first: 1000, orderBy: timestamp, orderDirection: desc, where: {market: $poolId}) {
          amountUSD
          amount
          blockNumber
          from
          timestamp
        }
        repays(first: 1000, orderBy: timestamp, orderDirection: desc, where: {market: $poolId}) {
          timestamp
          blockNumber
          from
          amount
          amountUSD
        }
        liquidates(first: 1000, orderBy: timestamp, orderDirection: desc, where: {market: $poolId}) {
          timestamp
          blockNumber
          from
          amount
          amountUSD
          profitUSD
        }
        deposits(first: 1000, orderBy: timestamp, orderDirection: desc, where: {market: $poolId}) {
          timestamp
          blockNumber
          from
          amount
          amountUSD
        }
        borrows(first: 1000, orderBy: timestamp, orderDirection: desc, where: {market: $poolId}) {
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
    totalBorrowUSD: "BigDecimal!",
  };

  const events = ["withdraws", "repays", "liquidates", "deposits", "borrows"];
  return { entities, entitiesData, query, poolData, events, protocolFields };
};

export const schema120 = (): Schema => {
  const entities = [
    "financialsDailySnapshots",
    "usageMetricsDailySnapshots",
    "marketDailySnapshots",
    "usageMetricsHourlySnapshots",
    "marketHourlySnapshots",
  ];
  const entitiesData = {
    // Each Array within this array contains strings of the fields to pull for the entity type of the same index above
    financialsDailySnapshots: {
      dailySupplySideRevenueUSD: "BigDecimal!",
      dailyProtocolSideRevenueUSD: "BigDecimal!",
      dailyTotalRevenueUSD: "BigDecimal!",
      dailyBorrowUSD: "BigDecimal!",
      dailyDepositUSD: "BigDecimal!",
      dailyLiquidateUSD: "BigDecimal!",
      cumulativeSupplySideRevenueUSD: "BigDecimal!",
      cumulativeProtocolSideRevenueUSD: "BigDecimal!",
      cumulativeTotalRevenueUSD: "BigDecimal!",
      cumulativeBorrowUSD: "BigDecimal!",
      cumulativeDepositUSD: "BigDecimal!",
      cumulativeLiquidateUSD: "BigDecimal!",
      totalDepositBalanceUSD: "BigDecimal!",
      totalBorrowBalanceUSD: "BigDecimal!",
      totalValueLockedUSD: "BigDecimal!",
      mintedTokenSupplies: "[BigInt!]",
      protocolControlledValueUSD: "BigDecimal",
      timestamp: "BigInt!",
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
      timestamp: "BigInt!",
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
      rates: "[InterestRate!]!",
      exchangeRate: "BigDecimal",
      rewardTokenEmissionsAmount: "[BigInt!]",
      rewardTokenEmissionsUSD: "[BigDecimal!]",
      timestamp: "BigInt!",
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
      timestamp: "BigInt!",
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
      rates: "[InterestRate!]!",
      rewardTokenEmissionsAmount: "[BigInt!]",
      rewardTokenEmissionsUSD: "[BigDecimal!]",
      timestamp: "BigInt!",
    },
  };

  const adjustedMarketDailyFields = Object.keys(entitiesData.marketDailySnapshots);
  const adjustedMarketHourlyFields = Object.keys(entitiesData.marketHourlySnapshots);
  adjustedMarketDailyFields[adjustedMarketDailyFields.indexOf("rates")] = "rates{side,rate,type}";
  adjustedMarketHourlyFields[adjustedMarketHourlyFields.indexOf("rates")] = "rates{side,rate,type}";

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

  const marketDailyQuery =
    "marketDailySnapshots(first: 1000, orderBy: timestamp, orderDirection: desc, where: {market: $poolId}) {" +
    adjustedMarketDailyFields.join(",") +
    "}";
  const marketHourlyQuery =
    "marketHourlySnapshots(first: 1000, orderBy: timestamp, orderDirection: desc, where: {market: $poolId}) {" +
    adjustedMarketHourlyFields.join(",") +
    "}";

  const eventsFields = ["hash", "to", "from", "timestamp", "amount", "amountUSD"];

  const events: string[] = ["withdraws", "repays", "liquidates", "deposits", "borrows"];
  const eventsQuery: any[] = events.map((event) => {
    let options = "";
    const baseStr =
      event + "(first: 1000, orderBy: timestamp, orderDirection: desc, where: {market: $poolId}" + options + ") { ";
    let fields = eventsFields.join(", ");
    if (event === "liquidates") {
      fields += ", profitUSD";
    }
    return baseStr + fields + " }";
  });

  const poolData: { [x: string]: string } = {
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
    rates: "[InterestRate!]!",
    rewardTokenEmissionsAmount: "[BigInt!]",
    rewardTokenEmissionsUSD: "[BigDecimal!]",
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
      id
      name
      type
      schemaVersion
      subgraphVersion
    }
    lendingProtocols {
      id      
      name
      slug
      schemaVersion
      subgraphVersion
      methodologyVersion
      network
      type
      lendingType
      riskType
      mintedTokens {
        id
        decimals
      }
      cumulativeUniqueUsers
      totalValueLockedUSD
      protocolControlledValueUSD
      cumulativeSupplySideRevenueUSD
      cumulativeProtocolSideRevenueUSD
      cumulativeTotalRevenueUSD
      totalDepositBalanceUSD
      cumulativeDepositUSD
      totalBorrowBalanceUSD
      cumulativeBorrowUSD
      cumulativeLiquidateUSD
      mintedTokenSupplies
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
      id
      name
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
      rates {
        id
        side
        rate
        type
      }
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
    mintedTokenSupplies: "[BigInt!]",
  };

  return { entities, entitiesData, query, poolData, events, protocolFields };
};
