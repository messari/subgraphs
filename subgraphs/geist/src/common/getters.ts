import { Address } from "@graphprotocol/graph-ts";

import { Token } from "../../generated/schema";

import { 
    fetchTokenSymbol, 
    fetchTokenName, 
    fetchTokenDecimals 
} from "./tokens";


export function getOrCreateToken(tokenAddress: Address): Token {
  let token = Token.load(tokenAddress.toHexString());
  // fetch info if null
  if (!token) {
    token = new Token(tokenAddress.toHexString());
    token.symbol = fetchTokenSymbol(tokenAddress);
    token.name = fetchTokenName(tokenAddress);
    token.decimals = fetchTokenDecimals(tokenAddress);

    token.save();
  }
  return token;
}