import { Versions } from "../../constants";

export const schema = (version: string): string => {
  // The version group uses the first two digits  of the schema version and defaults to that schema.
  const versionGroupArr = version.split(".");
  versionGroupArr.pop();
  const versionGroup = versionGroupArr.join(".") + ".0";
  switch (versionGroup) {
    case Versions.Schema130:
      return schema130();
    case Versions.Schema201:
      return schema201();
    case Versions.Schema300:
      return schema300();
    default:
      return schema201();
  }
};

export const schema130 = (): string => {
  return `
    query Data($skipAmt: Int!) {
        markets(first: 10, skip: $skipAmt, orderBy:totalValueLockedUSD, orderDirection: desc) {
            id
            name

            rates {
              id
              side
              rate
              type
            }
            totalValueLockedUSD
            totalBorrowBalanceUSD
            totalDepositBalanceUSD
            rewardTokenEmissionsUSD
        }
    }`;
};

export const schema201 = (): string => {
  return `
    query Data($skipAmt: Int!) {
        markets(first: 10, skip: $skipAmt, orderBy:totalValueLockedUSD, orderDirection: desc) {
            id
            name
            rates {
              id
              side
              rate
              type
            }
            totalValueLockedUSD
            rewardTokenEmissionsUSD
            totalBorrowBalanceUSD
            totalDepositBalanceUSD
            positionCount
            openPositionCount
            closedPositionCount
            lendingPositionCount
            borrowingPositionCount
        }
    }`;
};

export const schema300 = (): string => {
  return `
    query Data($skipAmt: Int!) {
        markets(first: 10, skip: $skipAmt, orderBy:totalValueLockedUSD, orderDirection: desc) {
            id
            name
            rates {
              id
              side
              rate
              type
            }
            totalValueLockedUSD
            rewardTokenEmissionsUSD
            totalBorrowBalanceUSD
            totalDepositBalanceUSD
            positionCount
            openPositionCount
            closedPositionCount
            lendingPositionCount
            borrowingPositionCount
        }
    }`;
};
