import { Versions } from "../../constants";

export const schema = (version: string): string => {
  // The version group uses the first two digits  of the schema version and defaults to that schema.
  const versionGroupArr = version.split(".");
  versionGroupArr.pop();
  const versionGroup = versionGroupArr.join(".") + ".0";
  switch (versionGroup) {
    case Versions.Schema120:
      return schema120();
    case Versions.Schema130:
      return schema130();
    default:
      return schema130();
  }
};

export const schema120 = (): string => {
  return `
  query Data($skipAmt: Int!) {
    liquidityPools(first: 10, skip: $skipAmt, orderBy:totalValueLockedUSD, orderDirection: desc) {
      id
      name
      fees {
        feePercentage
        feeType
      }
      inputTokens{
        name
        symbol
      }
      rewardTokens {
        id
        type
        token {
          decimals
          name
          symbol
        }
      }
      dailySnapshots (first: 2, orderBy:timestamp, orderDirection: desc){
        dailyVolumeUSD
      }
      totalValueLockedUSD
      cumulativeVolumeUSD
      outputTokenSupply
      stakedOutputTokenAmount
      rewardTokenEmissionsUSD
    }
  }`;
};

export const schema130 = (): string => {
  return `
    query Data($skipAmt: Int!) {
      liquidityPools(first: 10, skip: $skipAmt, orderBy:totalValueLockedUSD, orderDirection: desc) {
        id
        name
        fees {
          feePercentage
          feeType
        }
        inputTokens{
          name
          symbol
        }
        rewardTokens {
          id
          type
          token {
            decimals
            name
            symbol
          }
        }
        dailySnapshots (first: 2, orderBy:timestamp, orderDirection: desc){
          dailyVolumeUSD
        }
        totalValueLockedUSD
        cumulativeVolumeUSD
        outputTokenSupply
        stakedOutputTokenAmount
        rewardTokenEmissionsUSD
      }
    }`;
};
