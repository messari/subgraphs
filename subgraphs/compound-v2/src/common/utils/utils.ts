// store common calculations
import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { CToken } from "../../types/templates/CToken/CToken";

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
