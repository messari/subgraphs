import { BigDecimal } from "@graphprotocol/graph-ts";
import {
  BD_ONE,
  BIGDECIMAL_ONE,
  BIGDECIMAL_SIX,
  BIGDECIMAL_THREE,
  BIGDECIMAL_TWELVE,
  BIGDECIMAL_TWO,
} from "./const";

// a fast approximation of (1 + rate)^exponent
export function bigDecimalExponential(
  rate: BigDecimal,
  exponent: BigDecimal
): BigDecimal {
  // binomial expansion to obtain (1 + x)^n : (1 + rate)^exponent
  // 1 + n *x + (n/2*(n-1))*x**2+(n/6*(n-1)*(n-2))*x**3+(n/12*(n-1)*(n-2)*(n-3))*x**4
  // this is less precise, but more efficient than `powerBigDecimal` when power is big
  const firstTerm = exponent.times(rate);
  const secondTerm = exponent
    .div(BIGDECIMAL_TWO)
    .times(exponent.minus(BIGDECIMAL_ONE))
    .times(rate.times(rate));
  const thirdTerm = exponent
    .div(BIGDECIMAL_SIX)
    .times(exponent.minus(BIGDECIMAL_TWO))
    .times(rate.times(rate).times(rate));
  const fourthTerm = exponent
    .div(BIGDECIMAL_TWELVE)
    .times(exponent.minus(BIGDECIMAL_THREE))
    .times(rate.times(rate).times(rate).times(rate));

  return BD_ONE.plus(firstTerm)
    .plus(secondTerm)
    .plus(thirdTerm)
    .plus(fourthTerm);
}
