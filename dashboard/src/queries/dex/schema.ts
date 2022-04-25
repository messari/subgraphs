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
  const entities = ["financialsDailySnapshots", "usageMetricsDailySnapshots", "poolDailySnapshots"];
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
      query Data($poolId: String){
        protocols {
          name
          type
          schemaVersion
          subgraphVersion
        }
        liquidityPools {
          id
          name
        }
        financialsDailySnapshots(first: 1000) {
          totalValueLockedUSD
          totalVolumeUSD
          protocolSideRevenueUSD
          supplySideRevenueUSD
          feesUSD
          timestamp
        }
        usageMetricsDailySnapshots(first: 1000) {
          totalUniqueUsers
          dailyTransactionCount
          activeUsers
          timestamp
        }
        poolDailySnapshots(first:1000, where: {pool: $poolId}) {
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
          }
          rewardTokens {
            name
          }
          name
          symbol
        }
        withdraws(first: 1000, id: $poolId) {
          amountUSD
          blockNumber
          from
          timestamp
        }
        deposits(first: 1000, id: $poolId) {
          timestamp
          blockNumber
          from
          amountUSD
        }
        swaps(first: 1000, id: $poolId) {
          timestamp
          from
          amountIn
          amountInUSD
          amountOutUSD
          amountOut
        }
      }
    `;

  const poolData = ["name", "symbol", "fees", "inputTokens", "outputToken", "rewardTokens"];

  const events = ["withdraws","deposits","swaps"]
  return { entities, entitiesData, query, poolData ,events};
};

export const schema110 = (): Schema => {
  const entities = ["financialsDailySnapshots", "usageMetricsDailySnapshots", "poolDailySnapshots"];
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

  const query = `
      query Data($poolId: String){
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
          timestamp
        }
        liquidityPools {
          id
          name
        }
        usageMetricsDailySnapshots(first: 1000) {
          totalUniqueUsers
          dailyTransactionCount
          activeUsers
          timestamp
        }
        poolDailySnapshots(first:1000, where: {pool: $poolId}) {
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
          inputTokens{
            decimals
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
        }
        withdraws(first: 1000, id: $poolId) {
          amountUSD
          blockNumber
          from
          timestamp
        }
        deposits(first: 1000, id: $poolId) {
          timestamp
          blockNumber
          from
          amountUSD
        }
        swaps(first: 1000, id: $poolId) {
          timestamp
          from
          amountIn
          amountInUSD
          amountOutUSD
          amountOut
        }
      }
      `;
  const poolData = ["name", "symbol", "fees", "inputTokens", "outputToken", "rewardTokens"];

  const events = ["withdraws","deposits","swaps"]

  return { entities, entitiesData, query, poolData ,events};
};
