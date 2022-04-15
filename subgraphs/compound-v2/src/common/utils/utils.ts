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

// calculate the power of a BigDecimal (.pow() is not native to BigDecimal)
export function powerBigDecimal(base: BigDecimal, power: i32): BigDecimal {
  let product = base;
  for (let i = 0; i < power; i++) {
    product = product.times(base);
  }
  return product;
}

// get the amount in underlying token from cToken
export function getExchangeRate(marketAddress: Address): BigInt {
  let cTokenContract = CToken.bind(marketAddress);
  return cTokenContract.exchangeRateStored();
}
