export const getSnapshotDailyVolume = (): string => {
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
}