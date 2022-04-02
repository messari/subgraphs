// store common calculations
import { Address, BigDecimal, BigInt, ethereum, log } from "@graphprotocol/graph-ts";
import { Market, Token } from "../../types/schema";
import { CToken } from "../../types/templates/CToken/CToken";
import { getOrCreateMarket, getOrCreateToken } from "../getters";
import { BIGDECIMAL_ZERO, BIGINT_ZERO, COMPOUND_DECIMALS } from "./constants";

// turn exponent into a BigDecimal number
export function exponentToBigDecimal(decimals: i32): BigDecimal {
  let bigDecimal = BigDecimal.fromString("1");
  for (let i = 0; i < decimals; i++) {
    bigDecimal = bigDecimal.times(BigDecimal.fromString("10"));
  }
  return bigDecimal;
}

// get the amount in underlying token from cToken
export function getExchangeRate(marketAddress: Address, event: ethereum.Event): BigInt {
  let market = getOrCreateMarket(event, marketAddress);
  let underlyingToken = getOrCreateToken(market.inputTokens[0]);
  let underlyingDecimals = underlyingToken.decimals;
  let mantissaFactor = 18;
  let mantissaFactorBD = exponentToBigDecimal(mantissaFactor);
  let cTokenContract = CToken.bind(marketAddress);

  /*
   * Exchange rate explained:
   * In Practice:
   *    - if you call cDAI on etherscan you get (2.0 * 10^26)
   *    - if you call cUSDC on etherscan you get (2.0 * 10^14)
   *    - the real value is ~0.02 so cDAI is off by 10^28, and cUSDC 10^16
   * How to accomadate this:
   *    - must divide by tokenDecimals, so 10^underlyingDecimals (use exponenttoBigDecimal())
   *    - must multiply by cTokenDecimals, so 10^COMPOUND_DECIMALS
   *    - must divide by mantissaFactorBD, so 10^18
   */
  let exchangeRate = cTokenContract.exchangeRateStored();
  // .toBigDecimal()
  // .div(exponentToBigDecimal(underlyingDecimals))
  // .times(exponentToBigDecimal(COMPOUND_DECIMALS))
  // .div(mantissaFactorBD)
  // .truncate(mantissaFactor);
  return exchangeRate;
}
