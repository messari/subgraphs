import { Schema, Versions } from "../../constants";

export const schema = (version: string): Schema => {
  switch (version) {
    case Versions.Schema100:
      return schema100();
    case Versions.Schema110:
      return schema110();
    case Versions.Schema120:
      return schema120();
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

export const schema120 = (): Schema => {
  const entities = ["financialsDailySnapshots", "usageMetricsDailySnapshots", "vaultDailySnapshots", "UsageMetricsHourlySnapshot", "vaultHourlySnapshots"];
  const entitiesData = [
    // Each Array within this array contains strings of the fields to pull for the entity type of the same index above
    [
      "totalValueLockedUSD",
      "protocolControlledValueUSD",
      "dailySupplySideRevenueUSD",
      "cumulativeSupplySideRevenueUSD",
      "dailyProtocolSideRevenueUSD",
      "cumulativeProtocolSideRevenueUSD",
      "dailyTotalRevenueUSD", 
      "cumulativeTotalRevenueUSD",
      "timestamp"
    ],
    [
      "dailyActiveUsers",
      "cumulativeUniqueUsers",
      "dailyTransactionCount",
      "dailyDepositCount",
      "dailyWithdrawCount",
      "timestamp"
    ],
    [
      "vault",
      "totalValueLockedUSD",
      "totalVolumeUSD",
      "inputTokenBalance",
      "outputTokenSupply",
      "outputTokenPriceUSD",
      "pricePerShare",
      "stakedOutputTokenAmount",
      "rewardTokenEmissionsAmount",
      "rewardTokenEmissionsUSD",
      "timestamp"
    ],
    [
      "hourlyActiveUsers",
      "cumulativeUniqueUsers",
      "hourlyTransactionCount",
      "hourlyDepositCount",
      "hourlyWithdrawCount",
      "timestamp"
    ],
    [
      "vault",
      "totalValueLockedUSD",
      "inputTokenBalance",
      "outputTokenSupply",
      "outputTokenPriceUSD",
      "pricePerShare",
      "stakedOutputTokenAmount",
      "rewardTokenEmissionsAmount",
      "rewardTokenEmissionsUSD",
      "timestamp"
    ]
  ];
  const entitiesQuery = entities.map((entity, index) => {
    let options = "";
    if (entity === "vaultDailySnapshots" || entity === "vaultHourlySnapshots") {
      options = ", vault: $poolId"
    }
    // If certain fields which refer to other entities are present, add {id} to pull the id of that inset entity
    // It is added this way to not be included in the entitiesData sub arrays
    const poolIdx = entitiesData[index].indexOf('vault');
    if (poolIdx >= 0) {
      entitiesData[index][poolIdx] += '{id}';
    }
    const baseStr = entity + "(first: 1000" + options + ") {"
    const fields = entitiesData[index].join(",");
    return baseStr + fields + '}'
  });
  const events = ["withdraws","deposits"];
  const eventsFields = [
    "hash",
    "to",
    "from",
    "timestamp",
    "asset{id}",
    "amount",
    "amountUSD",
    "vault{id}"
  ];
  const eventsQuery = events.map((event) => {
    let options = "";
    const baseStr = event + "(first: 1000, id: $poolId" + options + ") {"
    const fields = eventsFields.join(",");
    return baseStr + fields + '}'
  });
  const poolData = [
    "name",
    "symbol",
    "fees",
    "depositLimit",
    "inputTokens",
    "outputToken",
    "rewardTokens",
    "rewardTokenEmissionsAmount",
    "rewardTokenEmissionsUSD",
    "stakedOutputTokenAmount",
    "pricePerShare"
  ];
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
        ${entitiesQuery}
        ${eventsQuery}
        vault(id: $poolId){
          name
          symbol
          depositLimit
          timestamp
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
          rewardTokenEmissionsAmount
          rewardTokenEmissionsUSD
          stakedOutputTokenAmount
        }
      }
      `;

  return { entities, entitiesData, query, poolData ,events};
};
