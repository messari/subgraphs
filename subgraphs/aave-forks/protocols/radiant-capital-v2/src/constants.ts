import {
  BIGDECIMAL_ZERO,
  BIGINT_ONE,
  BIGINT_TEN,
  INT_ONE,
  INT_ZERO,
  Network,
} from "../../../src/constants";
import { BigDecimal, BigInt } from "@graphprotocol/graph-ts";

/////////////////////
///// Addresses /////
/////////////////////

export const REWARD_TOKEN_ADDRESS =
  "0x3082cc23568ea640225c2467653db90e9250aaa0"; // RDNT token
export const RWETH_ADDRESS = "0x0df5dfd95966753f01cb80e76dc20ea958238c46";

/////////////////////////////
///// Protocol Specific /////
/////////////////////////////

export namespace Protocol {
  export const NAME = "Radiant Capital V2";
  export const SLUG = "radiant-capital-v2";
  export const PROTOCOL_ADDRESS = "0x091d52cace1edc5527c99cdcfa6937c1635330e4"; // addresses provider
  export const NETWORK = Network.ARBITRUM_ONE;
}

// Number of decimals in which rToken oracle prices are returned.
export const rTOKEN_DECIMALS = 8;
export const PRECISION = BigInt.fromString("100000000000000000"); // Uniswap V3 precision decimals
export const Q192 = BigInt.fromString(
  "6277101735386680763835789423207666416102355444464034512896"
); // Uniswap V3 Pool constant

export function exponentToBigInt(decimals: i32): BigInt {
  let bd = BIGINT_ONE;
  for (let i = INT_ZERO; i < (decimals as i32); i = i + INT_ONE) {
    bd = bd.times(BIGINT_TEN);
  }
  return bd;
}

// return 0 if denominator is 0 in division
export function safeDiv(amount0: BigDecimal, amount1: BigDecimal): BigDecimal {
  if (amount1.equals(BIGDECIMAL_ZERO)) {
    return BIGDECIMAL_ZERO;
  } else {
    return amount0.div(amount1);
  }
}
