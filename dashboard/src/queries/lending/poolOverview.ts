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
        markets(first: 100, skip: $skipAmt) {
            inputTokens{
                decimals
                name
              }
              outputToken {
                id
              }
             
              rewardTokens{
                id
              }
              id
             name
             isActive
             canUseAsCollateral
             canBorrowFrom
             maximumLTV
             liquidationThreshold
             liquidationPenalty
             depositRate
             stableBorrowRate
             variableBorrowRate
             rewardTokenEmissionsAmount
             rewardTokenEmissionsUSD
        }
    }`;
};

export const schema110 = (): string => {
  return `
    query Data($skipAmt: Int!) {
        markets(first: 100, skip: $skipAmt) {
            id
            name
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
            rewardTokens{
              id
              decimals
              name
              symbol
            }
            inputTokenBalances
            outputTokenSupply
           isActive
           canUseAsCollateral
           canBorrowFrom
           maximumLTV
           liquidationThreshold
           liquidationPenalty
           depositRate
           stableBorrowRate
           variableBorrowRate
           rewardTokenEmissionsAmount
           rewardTokenEmissionsUSD
        }
    }`;
};

export const schema120 = (): string => {
  return `
    query Data($skipAmt: Int!) {
        markets(first: 100, skip: $skipAmt) {
            id
            name
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
            rates {
              id
              side
              rate
              type
            }
            isActive
            canUseAsCollateral
            canBorrowFrom
            maximumLTV
            liquidationThreshold
            liquidationPenalty
            totalValueLockedUSD
            totalDepositBalanceUSD
            cumulativeDepositUSD
            totalBorrowBalanceUSD
            cumulativeBorrowUSD
            cumulativeLiquidateUSD
            inputTokenBalance
            inputTokenPriceUSD
            outputTokenSupply
            outputTokenPriceUSD
            exchangeRate
            rewardTokenEmissionsAmount
            rewardTokenEmissionsUSD
        }
    }`;
};
