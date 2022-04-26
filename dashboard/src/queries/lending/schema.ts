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
        marketDailySnapshots(first:1000, market: $poolId) {
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

export const schema120 = (): Schema => {
  const entities = ["financialsDailySnapshots", "usageMetricsDailySnapshots", "marketDailySnapshots", "UsageMetricsHourlySnapshot", "marketHourlySnapshots"];
  const entitiesData = [
    // Each Array within this array contains strings of the fields to pull for the entity type of the same index above
    [
      "totalValueLockedUSD",
      "protocolControlledValueUSD",
      "mintedTokenSupplies",
      "dailySupplySideRevenueUSD",
      "cumulativeSupplySideRevenueUSD",
      "dailyProtocolSideRevenueUSD",
      "cumulativeProtocolSideRevenueUSD",
      "dailyTotalRevenueUSD", 
      "cumulativeTotalRevenueUSD",
      "dailyLiquidateUSD",
      "cumulativeLiquidateUSD",
      "timestamp"
    ],
    [
      "dailyActiveUsers",
      "cumulativeUniqueUsers",
      "dailyTransactionCount",
      "dailyDepositCount",
      "dailyWithdrawCount",
      "dailyBorrowCount",
      "dailyRepayCount",
      "dailyLiquidateCount",
      "timestamp"
    ],
    [
      "market",
      "totalValueLockedUSD",
      "totalVolumeUSD",
      "totalDepositBalanceUSD",
      "dailyDepositUSD",
      "cumulativeDepositUSD",
      "totalBorrowBalanceUSD",
      "dailyBorrowUSD",
      "cumulativeBorrowUSD",
      "dailyLiquidateUSD",
      "cumulativeLiquidateUSD",
      "inputTokenBalance",
      "inputTokenPriceUSD",
      "outputTokenSupply",
      "outputTokenPriceUSD",
      "exchangeRate",
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
      "hourlyBorrowCount",
      "hourlyRepayCount",
      "hourlyLiquidateCount",
      "timestamp"
    ],
    [
      "market",
      "totalValueLockedUSD",
      "totalDepositBalanceUSD",
      "hourlyDepositUSD",
      "cumulativeDepositUSD",
      "totalBorrowBalanceUSD",
      "hourlyBorrowUSD",
      "cumulativeBorrowUSD",
      "hourlyLiquidateUSD",
      "cumulativeLiquidateUSD",
      "inputTokenBalance",
      "inputTokenPriceUSD",
      "outputTokenSupply",
      "outputTokenPriceUSD",
      "exchangeRate",
      "stakedOutputTokenAmount",
      "rewardTokenEmissionsAmount",
      "rewardTokenEmissionsUSD",
      "timestamp"
    ]
  ];
  const entitiesQuery = entities.map((entity, index) => {
    let options = "";
    if (entity === "marketDailySnapshots" || entity === "marketHourlySnapshots") {
      options = ", market: $poolId"
    }
    const baseStr = entity + "(first: 1000" + options + ") {"
    // If certain fields which refer to other entities are present, add {id} to pull the id of that inset entity
    // It is added this way to not be included in the entitiesData sub arrays
    const poolIdx = entitiesData[index].indexOf('market');
    if (poolIdx >= 0) {
      entitiesData[index][poolIdx] += '{id}';
    }
    const fields = entitiesData[index].join(",");
    return baseStr + fields + '}'
  });

  const eventsFields = [
    "hash",
    "to",
    "from",
    "timestamp",
    "asset{id}",
    "amount",
    "amountUSD",
    "market{id}"
  ];

  const events = ["withdraws","repays","liquidates","deposits","borrows"]
  const eventsQuery = events.map((event) => {
    let options = "";
    const baseStr = event + "(first: 1000, id: $poolId" + options + ") {"
    let fields = eventsFields.join(",");
    if (event === "liquidates") {
      fields += ",profitUSD"
    }
    return baseStr + fields + '}'
  });
  
  const poolData = [
    "name",
    "inputToken",
    "outputToken",
    "rewardTokens",
    "isActive",
    "canUseAsCollateral",
    "canBorrowFrom",
    "maximumLTV",
    "liquidationThreshold",
    "liquidationPenalty",
    "totalValueLockedUSD",
    "totalDepositBalanceUSD",
    "cumulativeDepositUSD",
    "totalBorrowBalanceUSD",
    "cumulativeBorrowUSD",
    "cumulativeLiquidateUSD",
    "inputTokenBalance",
    "inputTokenPriceUSD",
    "outputTokenSupply",
    "outputTokenPriceUSD",
    "exchangeRate",
    "depositRate",
    "stableBorrowRate",
    "variableBorrowRate",
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
      markets {
        id
        name
      }
      ${entitiesQuery}
      ${eventsQuery}
      market(id:$poolId){
        inputToken{
          decimals
          name
        }
        rewardTokens{
          name
        }
        outputToken{
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
        depositRate
        stableBorrowRate
        variableBorrowRate
        rewardTokenEmissionsAmount
        rewardTokenEmissionsUSD
      }
    }
    `;
  return { entities, entitiesData, query, poolData ,events};
};

