import { BigInt, Bytes } from "@graphprotocol/graph-ts";

import { Pool } from "../sdk/protocols/perpfutures/pool";
import { BIGINT_ZERO } from "../sdk/util/constants";

import { Token } from "../../generated/schema";

export function createTokenAmountArray(
  pool: Pool,
  tokens: Token[],
  amounts: BigInt[]
): BigInt[] {
  if (tokens.length != amounts.length) {
    return new Array<BigInt>();
  }

  const tokenAmounts = new Array<BigInt>(pool.getInputTokens().length).fill(
    BIGINT_ZERO
  );

  for (let idx = 0; idx < amounts.length; idx++) {
    const indexOfToken = pool.getInputTokens().indexOf(tokens[idx].id);
    tokenAmounts[indexOfToken] = amounts[idx];
  }

  return tokenAmounts;
}

export function getFundingRateId(pool: Pool, fundingIndex: BigInt): Bytes {
  return pool
    .getBytesID()
    .concat(Bytes.fromUTF8("-"))
    .concat(Bytes.fromByteArray(Bytes.fromBigInt(fundingIndex)));
}
