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
              cumulativeSupplySideRevenueUSD
              cumulativeProtocolSideRevenueUSD
              cumulativeTotalRevenueUSD
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

export const schema130 = (): string => {
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
