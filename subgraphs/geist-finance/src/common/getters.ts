import { Address } from "@graphprotocol/graph-ts";

import { Token } from "../../generated/schema";

import { BIGDECIMAL_ZERO, BIGINT_ZERO } from "./constants";

import { fetchTokenSymbol, fetchTokenName, fetchTokenDecimals } from "./tokens";

export function getOrCreateToken(tokenAddress: Address): Token {
  let token = Token.load(tokenAddress.toHexString());
  // fetch info if null
  if (!token) {
    token = new Token(tokenAddress.toHexString());
    token.symbol = fetchTokenSymbol(tokenAddress);
    token.name = fetchTokenName(tokenAddress);
    token.decimals = fetchTokenDecimals(tokenAddress);
    // TODO: Add in token price and block number by additional params
    token.lastPriceUSD = BIGDECIMAL_ZERO;
    token.lastPriceBlockNumber = BIGINT_ZERO;
    token.save();
  }
  return token;
}
