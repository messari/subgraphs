// store common calculations
import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { CTokenNew } from "../../../generated/Comptroller/CTokenNew";
import { BIGDECIMAL_ONE, BIGINT_TWO, BIGINT_ZERO } from "./constants";

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
  let cTokenContract = CTokenNew.bind(marketAddress);
  let tryExchangeRate = cTokenContract.try_exchangeRateStored();
  return tryExchangeRate.reverted ? BIGINT_ZERO : tryExchangeRate.value;
}

// (a/b)^n where n [0, 255]
export function pow(a: BigInt, b: BigInt, n: u8): BigDecimal {
  return a.pow(n).toBigDecimal().div(b.pow(n).toBigDecimal());
}

// utilizes exponentiation by squaring: https://stackoverflow.com/a/34660211
// for all exp >= 0
export function powBigDecimal(base: BigDecimal, exp: BigInt): BigDecimal {
  if (exp.equals(BIGINT_ZERO)) {
    return BIGDECIMAL_ONE;
  }

  let temp = powBigDecimal(base, exp.div(BIGINT_TWO));

  if (exp.mod(BIGINT_TWO).equals(BIGINT_ZERO)) {
    return temp.times(temp);
  } else {
    return base.times(temp).times(temp);
  }
}
