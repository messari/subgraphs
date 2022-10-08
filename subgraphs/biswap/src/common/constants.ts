import { BigDecimal, BigInt } from "@graphprotocol/graph-ts";

// https://thegraph.com/docs/en/hosted-service/what-is-hosted-service/#supported-networks-on-the-hosted-service
export namespace Network {
  export const ARBITRUM_ONE = "ARBITRUM_ONE";
  export const AVALANCHE = "AVALANCHE";
  export const AURORA = "AURORA";
  export const BSC = "BSC"; // aka BNB Chain
  export const CELO = "CELO";
  export const MAINNET = "MAINNET"; // Ethereum mainnet
  export const FANTOM = "FANTOM";
  export const FUSE = "FUSE";
  export const MOONBEAM = "MOONBEAM";
  export const MOONRIVER = "MOONRIVER";
  export const NEAR_MAINNET = "NEAR_MAINNET";
  export const OPTIMISM = "OPTIMISM";
  export const MATIC = "MATIC"; // aka Polygon
  export const XDAI = "XDAI"; // aka Gnosis Chain
}

export namespace ProtocolType {
  export const EXCHANGE = "EXCHANGE";
  export const LENDING = "LENDING";
  export const YIELD = "YIELD";
  export const BRIDGE = "BRIDGE";
  export const GENERIC = "GENERIC";
}

export namespace LiquidityPoolFeeType {
  export const FIXED_TRADING_FEE = "FIXED_TRADING_FEE";
  export const TIERED_TRADING_FEE = "TIERED_TRADING_FEE";
  export const DYNAMIC_TRADING_FEE = "DYNAMIC_TRADING_FEE";
  export const FIXED_LP_FEE = "FIXED_LP_FEE";
  export const DYNAMIC_LP_FEE = "DYNAMIC_LP_FEE";
  export const FIXED_PROTOCOL_FEE = "FIXED_PROTOCOL_FEE";
  export const DYNAMIC_PROTOCOL_FEE = "DYNAMIC_PROTOCOL_FEE";
  export const DEPOSIT_FEE = "DEPOSIT_FEE";
  export const WITHDRAWAL_FEE = "WITHDRAWAL_FEE";
}

export namespace RewardTokenType {
  export const DEPOSIT = "DEPOSIT";
  export const BORROW = "BORROW";
}

export namespace InterestRateType {
  export const STABLE = "STABLE";
  export const VARIABLE = "VARIABLE";
  export const FIXED_TERM = "FIXED_TERM";
}

export namespace InterestRateSide {
  export const LENDER = "LENDER";
  export const BORROWER = "BORROWER";
}

export namespace UsageType {
  export const DEPOSIT = "DEPOSIT";
  export const WITHDRAW = "WITHDRAW";
  export const SWAP = "SWAP";
}

export function exponentToBigDecimal(n: i32): BigDecimal {
  return exponentToBigInt(n).toBigDecimal();
}

export function exponentToBigInt(n: i32): BigInt {
  return BigInt.fromI32(10).pow(n as u8);
}

export namespace HelperStoreType {
  export const NATIVE_TOKEN = "NATIVE_TOKEN";
  export const USERS = "USERS";
  // Pool addresses are also stored in the HelperStore
}

export namespace FeeSwitch {
  export const ON = "ON";
  export const OFF = "OFF";
  // Pool addresses are also stored in the HelperStore
}

export namespace RewardIntervalType {
  export const BLOCK = "BLOCK";
  export const TIMESTAMP = "TIMESTAMP";
  export const NONE = "NONE";
}

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export const DEFAULT_DECIMALS = 18;
export const USDC_DECIMALS = 6;
export const USDC_DENOMINATOR = BigDecimal.fromString("1000000");
export const BIGINT_NEG_ONE = BigInt.fromI32(-1);
export const BIGINT_ZERO = BigInt.fromI32(0);
export const BIGINT_ONE = BigInt.fromI32(1);
export const BIGINT_TWO = BigInt.fromI32(2);
export const BIGINT_TEN = BigInt.fromI32(10);
export const BIGINT_FIFTY = BigInt.fromI32(50);
export const BIGINT_HUNDRED = BigInt.fromI32(100);
export const BIGINT_192 = BigInt.fromI32(192);
export const BIGINT_TEN_THOUSAND = BigInt.fromI32(10000);
export const BIGINT_MILLION = BigInt.fromI32(1000000);
export const BIGINT_MAX = BigInt.fromString(
  "115792089237316195423570985008687907853269984665640564039457584007913129639935"
);
export const BIGDECIMAL_NEG_ONE = new BigDecimal(BIGINT_NEG_ONE);
export const BIGDECIMAL_ZERO = new BigDecimal(BIGINT_ZERO);
export const BIGDECIMAL_ONE = new BigDecimal(BIGINT_ONE);
export const BIGDECIMAL_TWO = new BigDecimal(BIGINT_TWO);
export const BIGDECIMAL_TEN = new BigDecimal(BIGINT_TEN);
export const BIGDECIMAL_FIFTY = new BigDecimal(BIGINT_FIFTY);
export const BIGDECIMAL_HUNDRED = new BigDecimal(BIGINT_HUNDRED);
export const BIGDECIMAL_192 = new BigDecimal(BIGINT_192);
export const BIGDECIMAL_TEN_THOUSAND = new BigDecimal(BIGINT_TEN_THOUSAND);
export const BIGDECIMAL_MILLION = new BigDecimal(BIGINT_MILLION);

export const Q192 = BigInt.fromString(
  "6277101735386680763835789423207666416102355444464034512896"
);
export const PRECISION = BigInt.fromString("100000000000000000");

export const INT_ZERO = 0 as i32;
export const INT_ONE = 1 as i32;
export const INT_TWO = 2 as i32;
export const INT_THREE = 3 as i32;

export const MAX_UINT = BigInt.fromI32(2).times(BigInt.fromI32(255));
export const DAYS_PER_YEAR = new BigDecimal(BigInt.fromI32(365));
export const SECONDS_PER_DAY = 60 * 60 * 24;
export const SECONDS_PER_HOUR = 60 * 60;
export const MS_PER_DAY = new BigDecimal(BigInt.fromI32(24 * 60 * 60 * 1000));
export const MS_PER_YEAR = DAYS_PER_YEAR.times(
  new BigDecimal(BigInt.fromI32(24 * 60 * 60 * 1000))
);

// Fees
// TODO: verify why dev fee and swap fee are both set to 1
// https://bscscan.com/address/0x151f05a1dbdde68e7a607fb2076cf110ec7290de#readContract
export const BISWAP_TRADING_FEE = BigDecimal.fromString("0.2");
export const BISWAP_LP_FEE = BigDecimal.fromString("0.15");
export const BISWAP_PROTOCOL_FEE = BigDecimal.fromString("0");

export const MOST_RECENT_TRANSACTION = "MOST_RECENT_TRANSACTION";

export const BISWAP_FACTORY_ADDR = "0x858e3312ed3a876947ea49d572a7c42de08af7ee";
export const BISWAP_ROUTER_ADDR = "0x3a6d8cA21D1CF76F653A67577FA0D27453350dD8";
export const BISWAP_MASTERCHEF_ADDR =
  "0xDbc1A13490deeF9c3C12b44FE77b503c1B061739";
