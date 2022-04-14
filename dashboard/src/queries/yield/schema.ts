import { Schema, Versions } from "../../constants";

export const schema= (version: string)  : Schema => {
    switch(version){
        case Versions.Schema100:
            return schema100()
        case Versions.Schema110:
            return schema110()
        default:
            return schema100()
    }
}
export const schema100= ()  : Schema => {
    const entities = ["financialsDailySnapshots","usageMetricsDailySnapshots"];
    const entititesData = [
        [
          "totalValueLockedUSD",
          "totalVolumeUSD",
          "protocolSideRevenueUSD",
          "supplySideRevenueUSD",
          "feesUSD"
        ],
        [
          "totalUniqueUsers",
          "dailyTransactionCount",
          "activeUsers"
        ]
      ];
      const query =`
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
        usageMetricsDailySnapshots(first: 1000) {
          totalUniqueUsers
          dailyTransactionCount
          activeUsers
          timestamp
        }
      }
    `
    return {entities,entititesData,query}
}

export const schema110= ()  : Schema => {
    const entities = ["financialsDailySnapshots","usageMetricsDailySnapshots"];
    const entititesData = [
        [
          "totalValueLockedUSD",
          "totalVolumeUSD",
          "protocolSideRevenueUSD",
          "supplySideRevenueUSD",
          "totalRevenueUSD"
        ],
        [
          "totalUniqueUsers",
          "dailyTransactionCount",
          "activeUsers"
        ]
      ];
      const query =`
      {
        protocols {
          name
          type
          schemaVersion
          subgraphVersion
          methodologyVersion
        }
        financialsDailySnapshots(first: 1000) {
          totalValueLockedUSD
          totalVolumeUSD
          protocolSideRevenueUSD
          supplySideRevenueUSD
          totalRevenueUSD
          timestamp
        }
        usageMetricsDailySnapshots(first: 1000) {
          totalUniqueUsers
          dailyTransactionCount
          activeUsers
          timestamp
        }
      }
    `
    return {entities,entititesData,query}
}

