import { Versions } from "../../constants";

export const schema = (version: string): string => {
  // The version group uses the first two digits  of the schema version and defaults to that schema.
  const versionGroupArr = version.split(".");
  const spec = versionGroupArr.pop();
  const versionGroup = versionGroupArr.join(".") + ".0";
  switch (versionGroup) {
    case Versions.Schema130:
      return schema130();
    case Versions.Schema200:
      return schema200();
    case Versions.Schema300:
      return schema303();
    default:
      return schema130();
  }
};

export const schema130 = (): string => {
  return `
    query Data($skipAmt: Int!) {
      liquidityPools(first: 10, skip: $skipAmt, orderBy: totalValueLockedUSD, orderDirection: desc) {
        id
        name
        fees {
          feePercentage
          feeType
        }
        totalValueLockedUSD
        cumulativeVolumeUSD
        outputTokenSupply
        stakedOutputTokenAmount
        rewardTokenEmissionsUSD
      }
    }`;
};

export const schema200 = (): string => {
  return `
    query Data($skipAmt: Int!) {
      liquidityPools(first: 10, skip: $skipAmt, orderBy: totalValueLockedUSD, orderDirection: desc) {
        id
        name
        fees {
          feePercentage
          feeType
        }
        totalValueLockedUSD
        cumulativeVolumeUSD
        outputTokenSupply
        stakedOutputTokenAmount
        rewardTokenEmissionsUSD
      }
    }`;
};

export const schema303 = (): string => {
  return `
    query Data($skipAmt: Int!) {
      liquidityPools(first: 10, skip: $skipAmt, orderBy: totalValueLockedUSD, orderDirection: desc) {
        id
        name
        fees {
          feePercentage
          feeType
        }
        totalValueLockedUSD
        cumulativeVolumeUSD
        rewardTokenEmissionsUSD
      }
    }`;
};
