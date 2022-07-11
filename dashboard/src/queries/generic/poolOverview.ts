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
    case Versions.Schema130:
      return schema130();
    default:
      return schema130();
  }
};

export const schema100 = (): string => {
  return `query Data($skipAmt: Int!) {
        pools(first: 100, skip: $skipAmt, orderBy:totalValueLockedUSD, orderDirection: desc) {
            id
            name
            inputTokens {
            name
            }
            outputToken {
            name
            decimals
            }
            rewardTokens {
            id
            }
            symbol
        }
    }`;
};

export const schema110 = (): string => {
  return `
    query Data($skipAmt: Int!) {
        pools(first: 100, skip: $skipAmt, orderBy:totalValueLockedUSD, orderDirection: desc) {
            id
            name
            fees{
              feePercentage
              feeType
            }
            inputTokens{
              decimals
              name
            }
            outputToken {
              id
              decimals
            }
            rewardTokens {
              id
            }
            symbol
        }
    }`;
};

export const schema120 = (): string => {
  return `
    query Data($skipAmt: Int!) {
    pools(first: 50, skip: $skipAmt, orderBy:totalValueLockedUSD, orderDirection: desc) {
      id
      name
      symbol
      inputTokens{
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
      totalValueLockedUSD
      inputTokenBalances
      outputTokenSupply
      outputTokenPriceUSD
      stakedOutputTokenAmount
      rewardTokenEmissionsAmount
      rewardTokenEmissionsUSD
        }
    }`;
};

export const schema130 = (): string => {
  return `
    query Data($skipAmt: Int!) {
      pools(first: 50, skip: $skipAmt, orderBy:totalValueLockedUSD, orderDirection: desc) {
        id
        name
        symbol
        inputTokens{
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
        totalValueLockedUSD
        cumulativeSupplySideRevenueUSD
        cumulativeProtocolSideRevenueUSD
        cumulativeTotalRevenueUSD
        inputTokenBalances
        outputTokenSupply
        outputTokenPriceUSD
        stakedOutputTokenAmount
        rewardTokenEmissionsAmount
        rewardTokenEmissionsUSD
      }
    }`;
};
