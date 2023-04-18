import { Address, Bytes, log } from "@graphprotocol/graph-ts";

import { Perpetual } from "./protocol";
import * as constants from "../../util/constants";

import { Token, RewardToken } from "../../../../generated/schema";

/**
 * This file contains the TokenClass, which acts as
 * a wrapper for the Token entity making it easier to
 * use in mappings and get info about the token.
 *
 * Schema Version:  1.3.0
 * SDK Version:     1.1.0
 * Author(s):
 *  - @harsh9200
 *  - @dhruv-chauhan
 */

export interface TokenInitializer {
  getTokenParams(address: Address): TokenParams;
}

export class TokenParams {
  name: string;
  symbol: string;
  decimals: i32;
}

export class TokenManager {
  protocol: Perpetual;
  initializer: TokenInitializer;

  constructor(protocol: Perpetual, init: TokenInitializer) {
    this.protocol = protocol;
    this.initializer = init;
  }

  getOrCreateToken(address: Address): Token {
    let token = Token.load(address);
    if (!token) {
      token = new Token(address);

      const params = this.initializer.getTokenParams(address);
      token.name = params.name;
      token.symbol = params.symbol;
      token.decimals = params.decimals;
      token.save();
    }
    return token;
  }

  getOrCreateTokenFromBytes(address: Bytes): Token {
    return this.getOrCreateToken(Address.fromBytes(address));
  }

  getOrCreateRewardToken(
    token: Token,
    type: constants.RewardTokenType
  ): RewardToken {
    let id = Bytes.empty();
    if (type == constants.RewardTokenType.BORROW) {
      id = id.concatI32(0);
    } else if (type == constants.RewardTokenType.DEPOSIT) {
      id = id.concatI32(1);
    } else if (type == constants.RewardTokenType.STAKE) {
      id = id.concatI32(2);
    } else {
      log.error("Unsupported reward token type", []);
      log.critical("", []);
    }

    id = id.concat(token.id);

    let rewardToken = RewardToken.load(id);
    if (!rewardToken) {
      rewardToken = new RewardToken(id);
      rewardToken.type = type;
      rewardToken.token = token.id;
      rewardToken.save();
    }

    return rewardToken;
  }
}
