import { Versions } from "../../constants";

export const schema = (version: string): string => {
  // The version group uses the first two digits  of the schema version and defaults to that schema.
  const versionGroupArr = version.split(".");
  versionGroupArr.pop();
  const versionGroup = versionGroupArr.join(".") + ".0";
  switch (versionGroup) {
    case Versions.Schema100:
      return schema100();
    case Versions.Schema110:
      return schema110();
    case Versions.Schema120:
      return schema120();
    default:
      return schema120();
  }
};

export const schema100 = (): string => {
  return `
    query Data($skipAmt: Int!) {
        vaults(first: 50, skip: $skipAmt, orderBy:totalValueLockedUSD, orderDirection: desc) {
            id
            name
            fees{
              feePercentage
              feeType
            }
            inputTokens {
              name
              decimals
            }
            outputToken {
              id
              decimals
            }
            rewardTokens {
              id
              decimals
            }
            symbol
            depositLimit
            rewardTokenEmissionsAmount
            rewardTokenEmissionsUSD
        }
    }`;
};

export const schema110 = (): string => {
  return `
    query Data($skipAmt: Int!) {
        vaults(first: 50, skip: $skipAmt, orderBy:totalValueLockedUSD, orderDirection: desc) {
            id
            name
            fees{
              feePercentage
              feeType
            }
            inputTokens {
              name
              decimals
            }
            outputToken {
              id
              decimals
            }
            rewardTokens {
              id
              decimals
            }
            symbol
            depositLimit
            rewardTokenEmissionsAmount
            rewardTokenEmissionsUSD
        }
    }`;
};

export const schema120 = (): string => {
  return `
    query Data($skipAmt: Int!) {
        vaults(first: 50, skip: $skipAmt, orderBy:totalValueLockedUSD, orderDirection: desc) {
            id
        name
        symbol
        fees {
          feeType
          feePercentage
        }
        inputToken {
          id
          decimals
          name
          symbol
        }
        outputToken {
          id
          decimals
          name
          symbol
        }
        rewardTokens {
          id
          token {
            id
            decimals
            name
            symbol
          }
        }
        depositLimit
        totalValueLockedUSD
        stakedOutputTokenAmount
        pricePerShare
        inputTokenBalance
        outputTokenSupply
        outputTokenPriceUSD
        rewardTokenEmissionsAmount
        rewardTokenEmissionsUSD
        }
    }`;
};
