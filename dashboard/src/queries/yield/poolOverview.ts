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
      vaults(first: 10, skip: $skipAmt, orderBy:totalValueLockedUSD, orderDirection: desc) {
              id
              name
              symbol
              fees {
                feeType
                feePercentage
              }

              totalValueLockedUSD
              stakedOutputTokenAmount
              outputTokenSupply
              rewardTokenEmissionsUSD
              }
          }`;
};

export const schema130 = (): string => {
  return `
    query Data($skipAmt: Int!) {
      vaults(first: 10, skip: $skipAmt, orderBy:totalValueLockedUSD, orderDirection: desc) {
        id
        name
        fees {
          feeType
          feePercentage
        }

        totalValueLockedUSD
        stakedOutputTokenAmount
        outputTokenSupply
        rewardTokenEmissionsUSD
        }
    }`;
};
