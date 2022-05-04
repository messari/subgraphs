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
      return schema120();
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

export const schema120 = (): Schema => {
  const entities = [
    "financialsDailySnapshots",
    "usageMetricsDailySnapshots",
    "liquidityPoolDailySnapshots",
    "usageMetricsHourlySnapshots",
    "liquidityPoolHourlySnapshots"
  ];
  const entitiesData = [
    // Each Array within this array contains strings of the fields to pull for the entity type of the same index above
    [
      "totalValueLockedUSD",
      "protocolControlledValueUSD",
      "dailyVolumeUSD",
      "cumulativeVolumeUSD",
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
      "dailySwapCount",
      "timestamp"
    ],
    [
      "totalValueLockedUSD",
      "dailyVolumeUSD",
      "dailyVolumeByTokenAmount",
      "dailyVolumeByTokenUSD",
      "cumulativeVolumeUSD",
      "inputTokenBalances",
      "inputTokenWeights",
      "outputTokenSupply",
      "outputTokenPriceUSD",
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
      "hourlySwapCount",
      "timestamp"
    ],
    [
      "totalValueLockedUSD",
      "hourlyVolumeUSD",
      "hourlyVolumeByTokenAmount",
      "hourlyVolumeByTokenUSD",
      "cumulativeVolumeUSD",
      "inputTokenBalances",
      "inputTokenWeights",
      "outputTokenSupply",
      "outputTokenPriceUSD",
      "stakedOutputTokenAmount",
      "rewardTokenEmissionsAmount",
      "rewardTokenEmissionsUSD",
      "timestamp"
    ]
  ];
  const entitiesQuery = entities.map((entity, index) => {
    let options = "";
    if (entity === "liquidityPoolDailySnapshots" || entity === "liquidityPoolHourlySnapshots") {
      options = ", where: {pool: $poolId}"
    }
    const baseStr = entity + "(first: 1000" + options + ") {";
    const fields =  entitiesData[index].join(",");
    return baseStr + fields + '}';
  });

  const eventsFields = [
    "timestamp",
    "blockNumber",
    "from"
  ];

  const events = ["withdraws","deposits","swaps"];
  const eventsQuery = events.map((event) => {
    let options = "";
    const baseStr = event + "(first: 1000, where: {pool: $poolId}" + options + ") { "
    let fields = eventsFields.join(",");
    if (event === "swaps") {
      fields += ", amountIn, amountInUSD, amountOutUSD, amountOut";
    } else {
      fields += ', amountUSD';
    }
    return baseStr + fields + ' }'
  });
  
  const poolData = [
    "name",
    "symbol",
    "fees",
    "inputTokens",
    "outputToken",
    "rewardTokens",
    "totalValueLockedUSD",
    "cumulativeVolumeUSD",
    "inputTokenBalances",
    "inputTokenWeights",
    "outputTokenSupply",
    "outputTokenPriceUSD",
    "stakedOutputTokenAmount",
    "rewardTokenEmissionsAmount",
    "rewardTokenEmissionsUSD"
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
        ${entitiesQuery}
        ${eventsQuery}
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
          rewardTokens
          totalValueLockedUSD
          cumulativeVolumeUSD
          inputTokenBalances
          inputTokenWeights
          outputTokenSupply
          outputTokenPriceUSD
          stakedOutputTokenAmount
          rewardTokenEmissionsAmount
          rewardTokenEmissionsUSD
          name
          symbol
        }
      }
      `;
  return { entities, entitiesData, query, poolData ,events};
};
 