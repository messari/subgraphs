// store common calculations
import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { CToken } from "../../../generated/templates/CToken/CToken";

// turn exponent into a BigDecimal number
export function exponentToBigDecimal(decimals: i32): BigDecimal {
  let bigDecimal = BigDecimal.fromString("1");
  for (let i = 0; i < decimals; i++) {
    bigDecimal = bigDecimal.times(BigDecimal.fromString("10"));
  }
  return bigDecimal;
}

// get the amount in underlying token from cToken
export function getExchangeRate(marketAddress: Address): BigInt {
  let cTokenContract = CToken.bind(marketAddress);
  return cTokenContract.exchangeRateStored();
}

// (a/b)^n , for all n = [0, 255]
export function pow(a: BigInt, b: BigInt, n: u8): BigDecimal {
  return a.pow(n).toBigDecimal().div(b.pow(n).toBigDecimal());
}
