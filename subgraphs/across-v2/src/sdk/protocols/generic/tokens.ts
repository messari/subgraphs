import { Address, Bytes, log } from "@graphprotocol/graph-ts";
import { RewardToken, Token } from "../../../../generated/schema";
import { ProtocolManager } from "./protocol";
import { RewardTokenType } from "../../util/constants";

export interface TokenInitializer {
  getTokenParams(address: Address): TokenParams;
}

export class TokenParams {
  name: string;
  symbol: string;
  decimals: i32;
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
    token.save();
    return token;
  }

  getOrCreateRewardToken(type: RewardTokenType, token: Token): RewardToken {
    let id = Bytes.empty();
    if (type == RewardTokenType.BORROW) {
      id = id.concatI32(0);
    } else if (type == RewardTokenType.DEPOSIT) {
      id = id.concatI32(1);
    } else {
      log.error("Unsupported reward token type", []);
      log.critical("", []);
    }
    id = id.concat(token.id);

    let rToken = RewardToken.load(id);
    if (rToken) {
      return rToken;
    }

    rToken = new RewardToken(id);
    rToken.type = type;
    rToken.token = token.id;
    rToken.save();
    return rToken;
  }
}
