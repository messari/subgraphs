import { Versions } from "../../constants";

export const schema = (version: string): string => {
  // The version group uses the first two digits  of the schema version and defaults to that schema.
  const versionGroupArr = version.split(".");
  versionGroupArr.pop();
  const versionGroup = versionGroupArr.join(".") + ".0";
  switch (versionGroup) {
    case Versions.Schema100:
      return schema100();
    default:
      return schema100();
  }
};

export const schema100 = (): string => {
  return `
    query Data($skipAmt: Int!) {
      pools(first: 10, skip: $skipAmt, orderBy:totalValueLockedUSD, orderDirection: desc) {
        id
        name
        totalValueLockedUSD
        outputTokenSupply
        stakedOutputTokenAmount
        rewardTokenEmissionsUSD
      }
    }`;
};
