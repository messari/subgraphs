import { Versions } from "../constants";

export const getSnapshotDailyVolume = (version: string, type: string): string => {
  if (version?.includes(Versions.Schema120.split(".0")[0]) && type === "EXCHANGE") {
    return `
      query Data($pool1Id: String!, $pool2Id: String!,$pool3Id: String!,$pool4Id: String!,$pool5Id: String!,$pool6Id: String!,$pool7Id: String!,$pool8Id: String!,$pool9Id: String!,$pool10Id: String!) {
        pool1: liquidityPoolDailySnapshots(first: 2, orderBy:timestamp, orderDirection: desc, where: {pool: $pool1Id}) {
          id
          dailyVolumeUSD
        }
        pool2: liquidityPoolDailySnapshots(first: 2, orderBy:timestamp, orderDirection: desc, where: {pool: $pool2Id}) {
          id
          dailyVolumeUSD
        }
        pool3: liquidityPoolDailySnapshots(first: 2, orderBy:timestamp, orderDirection: desc, where: {pool: $pool3Id}) {
          id
          dailyVolumeUSD
        }
        pool4: liquidityPoolDailySnapshots(first: 2, orderBy:timestamp, orderDirection: desc, where: {pool: $pool4Id}) {
          id
          dailyVolumeUSD
        }
        pool5: liquidityPoolDailySnapshots(first: 2, orderBy:timestamp, orderDirection: desc, where: {pool: $pool5Id}) {
          id
          dailyVolumeUSD
        }
        pool6: liquidityPoolDailySnapshots(first: 2, orderBy:timestamp, orderDirection: desc, where: {pool: $pool6Id}) {
          id
          dailyVolumeUSD
        }
        pool7: liquidityPoolDailySnapshots(first: 2, orderBy:timestamp, orderDirection: desc, where: {pool: $pool7Id}) {
          id
          dailyVolumeUSD
        }
        pool8: liquidityPoolDailySnapshots(first: 2, orderBy:timestamp, orderDirection: desc, where: {pool: $pool8Id}) {
          id
          dailyVolumeUSD
        }
        pool9: liquidityPoolDailySnapshots(first: 2, orderBy:timestamp, orderDirection: desc, where: {pool: $pool9Id}) {
          id
          dailyVolumeUSD
        }
        pool10: liquidityPoolDailySnapshots(first: 2, orderBy:timestamp, orderDirection: desc, where: {pool: $pool10Id}) {
          id
          dailyVolumeUSD
        }
      }
    `;
  } else if (type === "EXCHANGE") {
    return `
    query Data($pool1Id: String!, $pool2Id: String!,$pool3Id: String!,$pool4Id: String!,$pool5Id: String!,$pool6Id: String!,$pool7Id: String!,$pool8Id: String!,$pool9Id: String!,$pool10Id: String!) {
      pool1: liquidityPoolDailySnapshots(first: 2, orderBy:timestamp, orderDirection: desc, where: {pool: $pool1Id}) {
        id
        dailySupplySideRevenueUSD
      }
      pool2: liquidityPoolDailySnapshots(first: 2, orderBy:timestamp, orderDirection: desc, where: {pool: $pool2Id}) {
        id
        dailySupplySideRevenueUSD
      }
      pool3: liquidityPoolDailySnapshots(first: 2, orderBy:timestamp, orderDirection: desc, where: {pool: $pool3Id}) {
        id
        dailySupplySideRevenueUSD
      }
      pool4: liquidityPoolDailySnapshots(first: 2, orderBy:timestamp, orderDirection: desc, where: {pool: $pool4Id}) {
        id
        dailySupplySideRevenueUSD
      }
      pool5: liquidityPoolDailySnapshots(first: 2, orderBy:timestamp, orderDirection: desc, where: {pool: $pool5Id}) {
        id
        dailySupplySideRevenueUSD
      }
      pool6: liquidityPoolDailySnapshots(first: 2, orderBy:timestamp, orderDirection: desc, where: {pool: $pool6Id}) {
        id
        dailySupplySideRevenueUSD
      }
      pool7: liquidityPoolDailySnapshots(first: 2, orderBy:timestamp, orderDirection: desc, where: {pool: $pool7Id}) {
        id
        dailySupplySideRevenueUSD
      }
      pool8: liquidityPoolDailySnapshots(first: 2, orderBy:timestamp, orderDirection: desc, where: {pool: $pool8Id}) {
        id
        dailySupplySideRevenueUSD
      }
      pool9: liquidityPoolDailySnapshots(first: 2, orderBy:timestamp, orderDirection: desc, where: {pool: $pool9Id}) {
        id
        dailySupplySideRevenueUSD
      }
      pool10: liquidityPoolDailySnapshots(first: 2, orderBy:timestamp, orderDirection: desc, where: {pool: $pool10Id}) {
        id
        dailySupplySideRevenueUSD
      }
    }
  `;
  } else if (type === "YIELD") {
    return `
    query Data($pool1Id: String!, $pool2Id: String!,$pool3Id: String!,$pool4Id: String!,$pool5Id: String!,$pool6Id: String!,$pool7Id: String!,$pool8Id: String!,$pool9Id: String!,$pool10Id: String!) {
      pool1: vaultDailySnapshots(first: 2, orderBy:timestamp, orderDirection: desc, where: {vault: $pool1Id}) {
        id
        dailySupplySideRevenueUSD
      }
      pool2: vaultDailySnapshots(first: 2, orderBy:timestamp, orderDirection: desc, where: {vault: $pool2Id}) {
        id
        dailySupplySideRevenueUSD
      }
      pool3: vaultDailySnapshots(first: 2, orderBy:timestamp, orderDirection: desc, where: {vault: $pool3Id}) {
        id
        dailySupplySideRevenueUSD
      }
      pool4: vaultDailySnapshots(first: 2, orderBy:timestamp, orderDirection: desc, where: {vault: $pool4Id}) {
        id
        dailySupplySideRevenueUSD
      }
      pool5: vaultDailySnapshots(first: 2, orderBy:timestamp, orderDirection: desc, where: {vault: $pool5Id}) {
        id
        dailySupplySideRevenueUSD
      }
      pool6: vaultDailySnapshots(first: 2, orderBy:timestamp, orderDirection: desc, where: {vault: $pool6Id}) {
        id
        dailySupplySideRevenueUSD
      }
      pool7: vaultDailySnapshots(first: 2, orderBy:timestamp, orderDirection: desc, where: {vault: $pool7Id}) {
        id
        dailySupplySideRevenueUSD
      }
      pool8: vaultDailySnapshots(first: 2, orderBy:timestamp, orderDirection: desc, where: {vault: $pool8Id}) {
        id
        dailySupplySideRevenueUSD
      }
      pool9: vaultDailySnapshots(first: 2, orderBy:timestamp, orderDirection: desc, where: {vault: $pool9Id}) {
        id
        dailySupplySideRevenueUSD
      }
      pool10: vaultDailySnapshots(first: 2, orderBy:timestamp, orderDirection: desc, where: {vault: $pool10Id}) {
        id
        dailySupplySideRevenueUSD
      }
    }
  `;
  } else {
    return `
    query Data($pool1Id: String!, $pool2Id: String!,$pool3Id: String!,$pool4Id: String!,$pool5Id: String!,$pool6Id: String!,$pool7Id: String!,$pool8Id: String!,$pool9Id: String!,$pool10Id: String!) {
      pool1: poolDailySnapshots(first: 2, orderBy:timestamp, orderDirection: desc, where: {pool: $pool1Id}) {
        id
        dailySupplySideRevenueUSD
      }
      pool2: poolDailySnapshots(first: 2, orderBy:timestamp, orderDirection: desc, where: {pool: $pool2Id}) {
        id
        dailySupplySideRevenueUSD
      }
      pool3: poolDailySnapshots(first: 2, orderBy:timestamp, orderDirection: desc, where: {pool: $pool3Id}) {
        id
        dailySupplySideRevenueUSD
      }
      pool4: poolDailySnapshots(first: 2, orderBy:timestamp, orderDirection: desc, where: {pool: $pool4Id}) {
        id
        dailySupplySideRevenueUSD
      }
      pool5: poolDailySnapshots(first: 2, orderBy:timestamp, orderDirection: desc, where: {pool: $pool5Id}) {
        id
        dailySupplySideRevenueUSD
      }
      pool6: poolDailySnapshots(first: 2, orderBy:timestamp, orderDirection: desc, where: {pool: $pool6Id}) {
        id
        dailySupplySideRevenueUSD
      }
      pool7: poolDailySnapshots(first: 2, orderBy:timestamp, orderDirection: desc, where: {pool: $pool7Id}) {
        id
        dailySupplySideRevenueUSD
      }
      pool8: poolDailySnapshots(first: 2, orderBy:timestamp, orderDirection: desc, where: {pool: $pool8Id}) {
        id
        dailySupplySideRevenueUSD
      }
      pool9: poolDailySnapshots(first: 2, orderBy:timestamp, orderDirection: desc, where: {pool: $pool9Id}) {
        id
        dailySupplySideRevenueUSD
      }
      pool10: poolDailySnapshots(first: 2, orderBy:timestamp, orderDirection: desc, where: {pool: $pool10Id}) {
        id
        dailySupplySideRevenueUSD
      }
    }
  `;
  }
};
