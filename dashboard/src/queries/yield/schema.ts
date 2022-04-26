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
  const entities = ["financialsDailySnapshots", "usageMetricsDailySnapshots", "vaultDailySnapshots"];
  const entitiesData = [
    ["totalValueLockedUSD", "totalVolumeUSD", "protocolSideRevenueUSD", "supplySideRevenueUSD", "feesUSD"],
    ["totalUniqueUsers", "dailyTransactionCount", "activeUsers"],
    [
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
          feesUSD
          timestamp
        }
        vaults {
          id
          name
        }
        usageMetricsDailySnapshots(first: 1000) {
          totalUniqueUsers
          dailyTransactionCount
          activeUsers
          timestamp
        }
        vaultDailySnapshots(first:1000, where: {vault: $poolId}) {
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
        withdraws(first: 1000, id: $poolId) {
          amountUSD
          amount
          blockNumber
          from
          timestamp
        }
        deposits(first: 1000, id: $poolId) {
          timestamp
          blockNumber
          from
          amount
          amountUSD
        }
      }
    `;
  const poolData = ["name", "symbol", "fees", "depositLimit", "inputTokens", "outputToken", "rewardTokens"];
  const events = ["withdraws","deposits"]
  
  return { entities, entitiesData, query, poolData,events };
};

export const schema110 = (): Schema => {
  const entities = ["financialsDailySnapshots", "usageMetricsDailySnapshots", "vaultDailySnapshots"];
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
  const events = ["withdraws","deposits"]

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
        vaults {
          id
          name
        }
        usageMetricsDailySnapshots(first: 1000) {
          totalUniqueUsers
          dailyTransactionCount
          activeUsers
          timestamp
        }
        vaultDailySnapshots(first:1000, where: {vault: $poolId}) {
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
        withdraws(first: 1000, id: $poolId) {
          amountUSD
          amount
          blockNumber
          from
          timestamp
        }
        deposits(first: 1000, id: $poolId) {
          timestamp
          blockNumber
          from
          amount
          amountUSD
        }

      }
      `;
  const poolData = ["name", "symbol", "fees", "depositLimit", "inputTokens", "outputToken", "rewardTokens"];

  return { entities, entitiesData, query, poolData ,events};
};
