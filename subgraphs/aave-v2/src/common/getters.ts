import { Address } from "@graphprotocol/graph-ts";

import { Token } from "../../generated/schema";

import { fetchTokenSymbol, fetchTokenName, fetchTokenDecimals } from "./tokens";

import { SECONDS_PER_DAY } from "../common/constants";

export function getOrCreateToken(tokenAddress: Address, underlyingAsset: string = ''): Token {
  let token = Token.load(tokenAddress.toHexString());
  // fetch info if null
  if (!token) {
    token = new Token(tokenAddress.toHexString());
    token.symbol = fetchTokenSymbol(tokenAddress);
    token.name = fetchTokenName(tokenAddress);
    token.decimals = fetchTokenDecimals(tokenAddress);
    token.underlyingAsset = underlyingAsset;

    token.save();
  }
  return token;
}

export function getDaysSinceEpoch(secondsSinceEpoch: number): string {
  return (<i32>Math.floor(secondsSinceEpoch / SECONDS_PER_DAY)).toString();
}
