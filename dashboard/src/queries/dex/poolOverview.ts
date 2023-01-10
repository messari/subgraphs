import { Versions } from "../../constants";

export const schema = (version: string): string => {
  // The version group uses the first two digits  of the schema version and defaults to that schema.
  const versionGroupArr = version.split(".");
  const spec = versionGroupArr.pop();
  const versionGroup = versionGroupArr.join(".") + ".0";
  switch (versionGroup) {
    case Versions.Schema120:
      return schema120();
    case Versions.Schema130:
      return schema130();
    case Versions.Schema200:
      return schema200();
    case Versions.Schema300:
      if (spec === "1") return schema301();
      return schema300();
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
      liquidityPools(first: 10, skip: $skipAmt, orderBy:totalValueLockedUSD, orderDirection: desc) {
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

export const schema300 = (): string => {
  return `
    query Data($skipAmt: Int!) {
      liquidityPools(first: 10, skip: $skipAmt, orderBy:totalValueLockedUSD, orderDirection: desc) {
        id
        name
        fees {
          feePercentage
          feeType
        }
        totalValueLockedUSD
        cumulativeTotalVolumeUSD
        rewardTokenEmissionsUSD
      }
    }`;
};

export const schema301 = (): string => {
  return `
    query Data($skipAmt: Int!) {
      liquidityPools(first: 10, skip: $skipAmt, orderBy:totalValueLockedUSD, orderDirection: desc) {
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
