import { BigDecimal, BigInt, Bytes } from "@graphprotocol/graph-ts";
import { _ActiveAccount } from "../../generated/schema";

////////////////////////
///// Schema Enums /////
////////////////////////

// The network names corresponding to the Network enum in the schema.
// They also correspond to the ones in `dataSource.network()` after converting to lower case.
// See below for a complete list:
// https://thegraph.com/docs/en/hosted-service/what-is-hosted-service/#supported-networks-on-the-hosted-service
export namespace Network {
  export const ARBITRUM_ONE = "ARBITRUM_ONE";
  export const ARWEAVE_MAINNET = "ARWEAVE_MAINNET";
  export const AURORA = "AURORA";
  export const AVALANCHE = "AVALANCHE";
  export const BOBA = "BOBA";
  export const BSC = "BSC"; // aka BNB Chain
  export const CELO = "CELO";
  export const COSMOS = "COSMOS";
  export const CRONOS = "CRONOS";
  export const MAINNET = "MAINNET"; // Ethereum mainnet
  export const FANTOM = "FANTOM";
  export const FUSE = "FUSE";
  export const HARMONY = "HARMONY";
  export const JUNO = "JUNO";
  export const MOONBEAM = "MOONBEAM";
  export const MOONRIVER = "MOONRIVER";
  export const NEAR_MAINNET = "NEAR_MAINNET";
  export const OPTIMISM = "OPTIMISM";
  export const OSMOSIS = "OSMOSIS";
  export const MATIC = "MATIC"; // aka Polygon
  export const GNOSIS = "GNOSIS"; // aka xDAI
}

export namespace ProtocolType {
  export const EXCHANGE = "EXCHANGE";
  export const LENDING = "LENDING";
  export const YIELD = "YIELD";
  export const BRIDGE = "BRIDGE";
  export const GENERIC = "GENERIC";
}

export namespace LendingType {
  export const CDP = "CDP";
  export const POOLED = "POOLED";
}

export namespace PermissionType {
  export const WHITELIST_ONLY = "WHITELIST_ONLY";
  export const PERMISSIONED = "PERMISSIONED";
  export const PERMISSIONLESS = "PERMISSIONLESS";
  export const ADMIN = "ADMIN";
}

export namespace RiskType {
  export const GLOBAL = "GLOBAL";
  export const ISOLATED = "ISOLATED";
}

export namespace CollateralizationType {
  export const OVER_COLLATERALIZED = "OVER_COLLATERALIZED";
  export const UNDER_COLLATERALIZED = "UNDER_COLLATERALIZED";
  export const UNCOLLATERALIZED = "UNCOLLATERALIZED";
}

export namespace TokenType {
  export const REBASING = "REBASING";
  export const NON_REBASING = "NON_REBASING";
}

export namespace InterestRateType {
  export const STABLE = "STABLE";
  export const VARIABLE = "VARIABLE";
  export const FIXED = "FIXED";
}
export type InterestRateType = string;

export namespace InterestRateSide {
  export const LENDER = "LENDER";
  export const BORROWER = "BORROWER";
}

export namespace FeeType {
  export const LIQUIDATION_FEE = "LIQUIDATION_FEE";
  export const ADMIN_FEE = "ADMIN_FEE";
  export const PROTOCOL_FEE = "PROTOCOL_FEE";
  export const MINT_FEE = "MINT_FEE";
  export const WITHDRAW_FEE = "WITHDRAW_FEE";
  export const FLASHLOAN_PROTOCOL_FEE = "FLASHLOAN_PROTOCOL_FEE";
  export const FLASHLOAN_LP_FEE = "FLASHLOAN_LP_FEE";
  export const OTHER = "OTHER";
}

export namespace PositionSide {
  export const COLLATERAL = "COLLATERAL";
  export const BORROWER = "BORROWER";
}

export namespace OracleSource {
  export const UNISWAP = "UNISWAP";
  export const BALANCER = "BALANCER";
  export const CHAINLINK = "CHAINLINK";
  export const YEARN = "YEARN";
  export const SUSHISWAP = "SUSHISWAP";
  export const CURVE = "CURVE";
}

export namespace TransactionType {
  export const DEPOSIT = "DEPOSIT";
  export const WITHDRAW = "WITHDRAW";
  export const BORROW = "BORROW";
  export const REPAY = "REPAY";
  export const LIQUIDATE = "LIQUIDATE";
  export const TRANSFER = "TRANSFER";
  export const FLASHLOAN = "FLASHLOAN";

  export const LIQUIDATOR = "LIQUIDATOR";
  export const LIQUIDATEE = "LIQUIDATEE";

  export const SWAP = "SWAP"; // Swap between interest rate types
}

export namespace AccountActivity {
  export const DAILY = "DAILY";
  export const HOURLY = "HOURLY";
}

export namespace RewardTokenType {
  export const DEPOSIT = "DEPOSIT";
  export const VARIABLE_BORROW = "VARIABLE_BORROW";
  export const STABLE_BORROW = "STABLE_BORROW";
  export const STAKE = "STAKE";
}

export enum Transaction {
  DEPOSIT = 0,
  WITHDRAW = 1,
  BORROW = 2,
  REPAY = 3,
  LIQUIDATE = 4,
  TRANSFER = 5,
  FLASHLOAN = 6,
}

////////////////////////
///// Type Helpers /////
////////////////////////

export const INT_NEGATIVE_ONE = -1 as i32;
export const INT_ZERO = 0 as i32;
export const INT_ONE = 1 as i32;
export const INT_TWO = 2 as i32;
export const INT_THREE = 3 as i32;
export const INT_FOUR = 4 as i32;
export const INT_FIVE = 5 as i32;
export const INT_SIX = 6 as i32;
export const INT_NINE = 9 as i32;
export const INT_TEN = 10 as i32;
export const INT_SIXTEEN = 16 as i32;
export const INT_EIGHTTEEN = 18 as i32;
export const INT_THIRTY_TWO = 32 as i32;
export const INT_SIXTY_FOUR = 64 as i32;
export const INT_152 = 152 as i32;

export const BIGINT_NEGATIVE_ONE = BigInt.fromI32(-1);
export const BIGINT_ZERO = BigInt.fromI32(0);
export const BIGINT_ONE = BigInt.fromI32(1);
export const BIGINT_HUNDRED = BigInt.fromI32(100);
export const BIGINT_THREE_HUNDRED = BigInt.fromI32(300);
export const BIGINT_TEN_TO_EIGHTEENTH = BigInt.fromString("10").pow(18);

export const BIGDECIMAL_ZERO = new BigDecimal(BIGINT_ZERO);
export const BIGDECIMAL_ONE = new BigDecimal(BIGINT_ONE);
export const BIGDECIMAL_HUNDRED = new BigDecimal(BigInt.fromI32(100));

/////////////////////
///// Date/Time /////
/////////////////////

export const DAYS_PER_YEAR = 365;
export const SECONDS_PER_YEAR = 60 * 60 * 24 * DAYS_PER_YEAR;
export const SECONDS_PER_DAY = 60 * 60 * 24; // 86400
export const SECONDS_PER_HOUR = 60 * 60; // 3600

export const ETHEREUM_BLOCKS_PER_YEAR = SECONDS_PER_YEAR / 13; // 13 = seconds per block
export const AVALANCHE_BLOCKS_PER_YEAR = SECONDS_PER_YEAR / 2; // 2 = seconds per block. This is NOT ideal since avalanche has variable block time.
export const FANTOM_BLOCKS_PER_YEAR = SECONDS_PER_YEAR / 1; // 1 = seconds per block. This is NOT ideal since fantom has variable block time.
export const BSC_BLOCKS_PER_YEAR = SECONDS_PER_YEAR / 3; // 3 = seconds per block
export const MATIC_BLOCKS_PER_YEAR = SECONDS_PER_YEAR / 2; // 2 = seconds per block
export const ARBITRUM_BLOCKS_PER_YEAR = SECONDS_PER_YEAR / 1; // 1 = seconds per block.

/////////////////////////////
/////        Math       /////
/////////////////////////////

export const mantissaFactor = 18;
export const cTokenDecimals = 8;
export const mantissaFactorBD = exponentToBigDecimal(mantissaFactor);
export const cTokenDecimalsBD = exponentToBigDecimal(cTokenDecimals);

// n => 10^n
export function exponentToBigDecimal(decimals: i32): BigDecimal {
  let result = BIGINT_ONE;
  const ten = BigInt.fromI32(10);
  for (let i = 0; i < decimals; i++) {
    result = result.times(ten);
  }
  return result.toBigDecimal();
}

// BigInt to BigDecimal
export function bigIntToBigDecimal(x: BigInt, decimals: i32): BigDecimal {
  return x.toBigDecimal().div(exponentToBigDecimal(decimals));
}

// bigDecimal to BigInt
export function bigDecimalToBigInt(x: BigDecimal): BigInt {
  return BigInt.fromString(x.truncate(0).toString());
}

//change number of decimals for BigDecimal
export function BDChangeDecimals(
  x: BigDecimal,
  from: i32,
  to: i32
): BigDecimal {
  if (to > from) {
    // increase number of decimals
    const diffMagnitude = exponentToBigDecimal(to - from);
    return x.times(diffMagnitude);
  } else if (to < from) {
    // decrease number of decimals
    const diffMagnitude = exponentToBigDecimal(from - to);
    return x.div(diffMagnitude);
  } else {
    return x;
  }
}

// insert value into arr at index
export function insert<Type>(
  arr: Array<Type>,
  value: Type,
  index: i32 = -1
): Array<Type> {
  if (arr.length == 0) {
    return [value];
  }
  if (index == -1 || index > arr.length) {
    index = arr.length;
  }
  const result: Type[] = [];
  for (let i = 0; i < index; i++) {
    result.push(arr[i]);
  }
  result.push(value);
  for (let i = index; i < arr.length; i++) {
    result.push(arr[i]);
  }
  return result;
}

// returns the increment to update the usage activity by
// 1 for a new account in the specified period, otherwise 0
export function activityCounter(
  account: Bytes,
  transactionType: string,
  useTransactionType: boolean,
  intervalID: i32, // 0 = no intervalID
  marketID: Bytes | null = null
): i32 {
  let activityID = account
    .toHexString()
    .concat("-")
    .concat(intervalID.toString());
  if (marketID) {
    activityID = activityID.concat("-").concat(marketID.toHexString());
  }
  if (useTransactionType) {
    activityID = activityID.concat("-").concat(transactionType);
  }
  let activeAccount = _ActiveAccount.load(activityID);
  if (!activeAccount) {
    // if account / market only + transactionType is LIQUIDATEE
    // then do not count that account as it did not spend gas to use the protocol
    if (!useTransactionType && transactionType == TransactionType.LIQUIDATEE) {
      return INT_ZERO;
    }

    activeAccount = new _ActiveAccount(activityID);
    activeAccount.save();
    return INT_ONE;
  }

  return INT_ZERO;
}

/////////////////////////////
/////     Addresses     /////
/////////////////////////////

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
