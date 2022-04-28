import { Schema, Versions } from "../../constants";

export const schema = (version: string): Schema => {
    // TEMPORARY? NEED TO CONSIDER KINDS OF CHANGES THAT DEFINE A SCHEMA UPDATE FROM 1.1.0 TO 1.2.0 VS UPDATE FROM 1.1.0 TO 1.1.1
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
      return schema120()
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
  const entities = [
    "financialsDailySnapshots",
    "usageMetricsDailySnapshots",
    "vaultDailySnapshots",
    "usageMetricsHourlySnapshots",
    "vaultHourlySnapshots"
  ];
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
      "totalValueLockedUSD",
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
      options = ", where: {vault: $poolId}"
    }
    const baseStr = entity + "(first: 1000" + options + ") {";
    const fields =  entitiesData[index].join(",");
    return baseStr + fields + '}';
  });
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
    const baseStr = event + "(first: 1000, where: {vault: $poolId}" + options + ") { "
    const fields = eventsFields.join(", ");
    return baseStr + fields + ' }'
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
          
          fees{
            feePercentage
            feeType
          }

          outputToken {
            name
          }
          rewardTokens {
            token {
              name
            }
          }
          rewardTokenEmissionsAmount
          rewardTokenEmissionsUSD
          stakedOutputTokenAmount
        }
      }
      `;
      console.log('query', query);

  return { entities, entitiesData, query, poolData ,events};
};
