import { Schema, Versions } from "../../constants";

export const schema = (version: string): Schema => {
  switch (version) {
    case Versions.Schema100:
      return schema100();
    case Versions.Schema110:
      return schema110();
    default:
      return schema100();
  }
};
export const schema100 = (): Schema => {
  const entities = ["financialsDailySnapshots", "usageMetricsDailySnapshots", "marketDailySnapshots"];
  const entitiesData = [
    ["totalValueLockedUSD", "totalVolumeUSD", "protocolSideRevenueUSD", "supplySideRevenueUSD", "feesUSD"],
    ["totalUniqueUsers", "dailyTransactionCount", "activeUsers"],
    [
      "totalValueLockedUSD",
      "totalVolumeUSD",
      "inputTokenBalances",
      "outputTokenSupply",
      "outputTokenPriceUSD",
      "rewardTokenEmissionsAmount",
      "rewardTokenEmissionsUSD",
    ],
  ];
  const query = `
      {
        protocols {
          name
          type
          schemaVersion
          subgraphVersion
        }
        financialsDailySnapshots(first: 1000) {
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
        usageMetricsDailySnapshots(first: 1000) {
          totalUniqueUsers
          dailyTransactionCount
          activeUsers
          timestamp
        }
        marketDailySnapshots(first:1000, where: {market: $poolId}) {
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
         
        withdraws(first: 1000, id: $poolId) {
          amountUSD
          amount
          blockNumber
          from
          timestamp
        }
        repays(first: 1000, id: $poolId) {
          timestamp
          blockNumber
          from
          amount
          amountUSD
        }
        liquidates(first: 1000, id: $poolId) {
          timestamp
          blockNumber
          from
          amount
          amountUSD
          profitUSD
        }
        deposits(first: 1000, id: $poolId) {
          timestamp
          blockNumber
          from
          amount
          amountUSD
        }
        borrows(first: 1000, id: $poolId) {
          timestamp
          blockNumber
          from
          amount
          amountUSD
        }
      }
    `;
  const poolData = [
    "inputTokens",
    "rewardTokens",
    "name",
    "isActive",
    "variableBorrowRate",
    "depositRate",
    "stableBorrowRate",
    "liquidationPenalty",
    "liquidationThreshold",
    "maximumLTV",
    "canBorrowFrom",
    "canUseAsCollateral",
  ];

  const events = ["withdraws","repays","liquidates","deposits","borrows"]
  return { entities, entitiesData, query, poolData ,events};
};

export const schema110 = (): Schema => {
  const entities = ["financialsDailySnapshots", "usageMetricsDailySnapshots", "marketDailySnapshots"];
  const entitiesData = [
    ["totalValueLockedUSD", "totalVolumeUSD", "protocolSideRevenueUSD", "supplySideRevenueUSD", "totalRevenueUSD"],
    ["totalUniqueUsers", "dailyTransactionCount", "activeUsers"],
    [
      "totalValueLockedUSD",
      "totalVolumeUSD",
      "inputTokenBalances",
      "outputTokenSupply",
      "outputTokenPriceUSD",
      "rewardTokenEmissionsAmount",
      "rewardTokenEmissionsUSD",
    ],
  ];

  const poolData = [
    "inputTokens",
    "rewardTokens",
    "name",
    "isActive",
    "variableBorrowRate",
    "depositRate",
    "stableBorrowRate",
    "liquidationPenalty",
    "liquidationThreshold",
    "maximumLTV",
    "canBorrowFrom",
    "canUseAsCollateral",
  ];
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
        financialsDailySnapshots(first: 1000) {
          totalValueLockedUSD
          totalVolumeUSD
          protocolSideRevenueUSD
          supplySideRevenueUSD
          timestamp
        }
        usageMetricsDailySnapshots(first: 1000) {
          totalUniqueUsers
          dailyTransactionCount
          activeUsers
          timestamp
        }
        marketDailySnapshots(first:1000, where: {market: $poolId}) {
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
        
        withdraws(first: 1000, id: $poolId) {
          amountUSD
          amount
          blockNumber
          from
          timestamp
        }
        repays(first: 1000, id: $poolId) {
          timestamp
          blockNumber
          from
          amount
          amountUSD
        }
        liquidates(first: 1000, id: $poolId) {
          timestamp
          blockNumber
          from
          amount
          amountUSD
          profitUSD
        }
        deposits(first: 1000, id: $poolId) {
          timestamp
          blockNumber
          from
          amount
          amountUSD
        }
        borrows(first: 1000, id: $poolId) {
          timestamp
          blockNumber
          from
          amount
          amountUSD
        }
      }
      `;
      const events = ["withdraws","repays","liquidates","deposits","borrows"]
      return { entities, entitiesData, query, poolData ,events};
    };
