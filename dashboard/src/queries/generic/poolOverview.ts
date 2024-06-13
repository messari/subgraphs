import { Versions } from "../../constants";

export const schema = (version: string): string => {
  // The version group uses the first two digits  of the schema version and defaults to that schema.
  const versionGroupArr = version.split(".");
  versionGroupArr.pop();
  const versionGroup = versionGroupArr.join(".") + ".0";
  switch (versionGroup) {
    case Versions.Schema140:
      return schema140();
    case Versions.Schema210:
      return schema210();
    case Versions.Schema300:
      return schema300();
    default:
      return schema300();
  }
};

export const schema140 = (): string => {
  return `
    query Data($skipAmt: Int!) {
    pools(first: 10, skip: $skipAmt, orderBy:totalValueLockedUSD, orderDirection: desc) {
      id
      name
      symbol
      totalValueLockedUSD
      outputTokenSupply
      stakedOutputTokenAmount
      rewardTokenEmissionsUSD
        }
    }`;
};

export const schema210 = (): string => {
  return `
    query Data($skipAmt: Int!) {
      pools(first: 10, skip: $skipAmt, orderBy:totalValueLockedUSD, orderDirection: desc) {
        id
        name
        symbol
        totalValueLockedUSD
        outputTokenSupply
        stakedOutputTokenAmount
        rewardTokenEmissionsUSD
      }
    }`;
};

export const schema300 = (): string => {
  return `
    query Data($skipAmt: Int!) {
      pools(first: 10, skip: $skipAmt, orderBy:totalValueLockedUSD, orderDirection: desc) {
        id
        name
        symbol
        totalValueLockedUSD
        outputTokenSupply
      }
    }`;
};
