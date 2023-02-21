import { Versions } from "../../constants";

export const schema = (version: string): string => {
  // The version group uses the first two digits  of the schema version and defaults to that schema.
  const versionGroupArr = version.split(".");
  versionGroupArr.pop();
  const versionGroup = versionGroupArr.join(".") + ".0";
  switch (versionGroup) {
    case Versions.Schema130:
      return schema130();
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
        inputTokens {
          id
          symbol
        }
        rewardTokens {
          token {
            symbol
          }
        }
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
