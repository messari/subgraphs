import { BigDecimal, BigInt } from "@graphprotocol/graph-ts";

//////////////////////////////
/////// Protocol Config //////
//////////////////////////////

export namespace Protocol {
  export const ID = "0x8487c5f8550e3c3e7734fe7dcf77db2b72e4a848";
  export const NAME = "Ether Fi";
  export const SLUG = "ether-fi";
}

//////////////////////////////
///// Ethereum Addresses /////
//////////////////////////////

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
export const ETH_ADDRESS = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";
export const EETH_ADDRESS = "0x35fa164735182de50811e8e2e824cfb9b6118ac2";
export const RETH_ADDRESS = "0xae78736cd615f374d3085123a210448e74fc6393"; // rETH
export const WSTETH_ADDRESS = "0x7f39c581f595b53c5cb19bd0b3f8da6c935e2ca0"; // wstETH
export const SFRXETH_ADDRESS = "0xac3e018457b222d93114458476f3e3416abbe38f"; // sfrxETH
export const CBETH_ADDRESS = "0xbe9895146f7af43049ca1c1ae358b0541ea49704"; // cbETH

export const EETH_LIQUIDITY_POOL_ADDRESS =
  "0x308861a430be4cce5502d0a12724771fc6daf216";

////////////////////////
///// Type Helpers /////
////////////////////////

export const DEFAULT_DECIMALS = 18;

export const USDC_DECIMALS = 6;
export const USDC_DENOMINATOR = BigDecimal.fromString("1000000");

export const BIGINT_ZERO = BigInt.fromI32(0);
export const BIGINT_ONE = BigInt.fromI32(1);
export const BIGINT_TWO = BigInt.fromI32(2);
export const BIGINT_TEN = BigInt.fromI32(10);
export const BIGINT_HUNDRED = BigInt.fromI32(100);
export const BIGINT_THOUSAND = BigInt.fromI32(1000);
export const BIGINT_TEN_TO_EIGHTEENTH = BigInt.fromString("10").pow(18);
export const BIGINT_MINUS_ONE = BigInt.fromI32(-1);
export const BIGINT_MAX = BigInt.fromString(
  "115792089237316195423570985008687907853269984665640564039457584007913129639935"
);

export const INT_NEGATIVE_ONE = -1 as i32;
export const INT_ZERO = 0 as i32;
export const INT_ONE = 1 as i32;
export const INT_TWO = 2 as i32;
export const INT_FOUR = 4 as i32;

export const BIGDECIMAL_ZERO = new BigDecimal(BIGINT_ZERO);
export const BIGDECIMAL_ONE = new BigDecimal(BIGINT_ONE);
export const BIGDECIMAL_TWO = new BigDecimal(BIGINT_TWO);
export const BIGDECIMAL_HUNDRED = new BigDecimal(BIGINT_HUNDRED);
export const BIGDECIMAL_MINUS_ONE = new BigDecimal(BIGINT_MINUS_ONE);

export const MAX_UINT = BigInt.fromI32(2).times(BigInt.fromI32(255));

export const BNFT_STAKING_AMOUNT = BigInt.fromI32(2).times(
  BIGINT_TEN_TO_EIGHTEENTH
);
export const TNFT_STAKING_AMOUNT = BigInt.fromI32(30).times(
  BIGINT_TEN_TO_EIGHTEENTH
);
export const MINIMUM_FULL_WITHDRAW_AMOUNT = BigInt.fromI32(31).times(
  BIGINT_TEN_TO_EIGHTEENTH
);
/////////////////////
///// Date/Time /////
/////////////////////

export const SECONDS_PER_DAY = 60 * 60 * 24; // 86400
export const SECONDS_PER_HOUR = 60 * 60; // 3600
export const SECONDS_PER_DAY_BI = BigInt.fromI32(SECONDS_PER_DAY);
export const SECONDS_PER_HOUR_BI = BigInt.fromI32(SECONDS_PER_HOUR);
export const MS_PER_DAY = new BigDecimal(BigInt.fromI32(24 * 60 * 60 * 1000));
export const DAYS_PER_YEAR = new BigDecimal(BigInt.fromI32(365));
export const MS_PER_YEAR = DAYS_PER_YEAR.times(
  new BigDecimal(BigInt.fromI32(24 * 60 * 60 * 1000))
);

////////////////
///// Misc /////
////////////////

export const ETH_SYMBOL = "ETH";
export const ETH_NAME = "Ether";
