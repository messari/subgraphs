import { BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { Token } from "../../generated/schema";
import { Pool } from "../sdk/protocols/perpfutures/pool";
import { BIGDECIMAL_ZERO, BIGINT_ZERO } from "../sdk/util/constants";

export function safeDivide(a: BigDecimal, b: BigDecimal): BigDecimal {
  if (b == BIGDECIMAL_ZERO) return BIGDECIMAL_ZERO;

  return a.div(b);
}

export function createTokenAmountArray(
  pool: Pool,
  tokens: Token[],
  amounts: BigInt[]
): BigInt[] {
  if (tokens.length != amounts.length) {
    return new Array<BigInt>();
  }

  let tokenAmounts = new Array<BigInt>(pool.getInputTokens().length).fill(
    BIGINT_ZERO
  );

  for (let idx = 0; idx < amounts.length; idx++) {
    const indexOfToken = pool.getInputTokens().indexOf(tokens[idx].id);
    tokenAmounts[indexOfToken] = amounts[idx];
  }

  return tokenAmounts;
}
