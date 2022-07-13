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
    case Versions.Schema201:
    default:
      return schema201();
  }
};

export const schema120 = (): string => {
  return `
    query Data($skipAmt: Int!) {
        markets(first: 50, skip: $skipAmt, orderBy:totalValueLockedUSD, orderDirection: desc) {
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

export const schema130 = (): string => {
  return `
    query Data($skipAmt: Int!) {
        markets(first: 50, skip: $skipAmt, orderBy:totalValueLockedUSD, orderDirection: desc) {
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
            cumulativeSupplySideRevenueUSD
            cumulativeProtocolSideRevenueUSD
            cumulativeTotalRevenueUSD
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

export const schema201 = (): string => {
  return `
    query Data($skipAmt: Int!) {
        markets(first: 50, skip: $skipAmt, orderBy:totalValueLockedUSD, orderDirection: desc) {
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
            cumulativeSupplySideRevenueUSD
            cumulativeProtocolSideRevenueUSD
            cumulativeTotalRevenueUSD
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

            positionCount
            openPositionCount
            closedPositionCount
            lendingPositionCount
            borrowingPositionCount
        }
    }`;
};
