import { ProtocolManager } from "./protocol";
import { Address } from "@graphprotocol/graph-ts";
import { Token } from "../../../../generated/schema";
import { BIGDECIMAL_ZERO } from "../../util/constants";

/**
 * This file contains the TokenManagerClass, which initializes
 * token entities.
 *
 * Schema Version:  3.0.0
 * SDK Version:     1.1.0
 * Author(s):
 *  - @steegecs
 *  - @shashwatS22
 */

export interface TokenInitializer {
  getTokenParams(address: Address): TokenParams;
}

export class TokenParams {
  name: string;
  symbol: string;
  decimals: i32;

  constructor(name: string, symbol: string, decimals: i32) {
    this.name = name;
    this.symbol = symbol;
    this.decimals = decimals;
  }
}

export class TokenManager {
  protocol: ProtocolManager;
  initializer: TokenInitializer;

  constructor(protocol: ProtocolManager, init: TokenInitializer) {
    this.protocol = protocol;
    this.initializer = init;
  }

  getOrCreateToken(address: Address): Token {
    let token = Token.load(address);
    if (token) {
      return token;
    }

    const params = this.initializer.getTokenParams(address);
    token = new Token(address);
    token.name = params.name;
    token.symbol = params.symbol;
    token.decimals = params.decimals;
    token.lastPriceUSD = BIGDECIMAL_ZERO;
    token.save();

    return token;
  }
}
