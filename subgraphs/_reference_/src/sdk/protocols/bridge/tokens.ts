import { Address, BigInt, Bytes, log } from "@graphprotocol/graph-ts";
import {
  RewardToken,
  Token,
  CrosschainToken,
  SupportedToken,
} from "../../../../generated/schema";
import { chainIDToNetwork } from "./chainIds";
import { Bridge } from "./protocol";
import { RewardTokenType } from "../../util/constants";

export interface TokenInitializer {
  getTokenParams(address: Address): TokenParams;
}

export interface TokenPresaver {
  preSaveToken(token: Token): Token;
}

export class TokenParams {
  name: string;
  symbol: string;
  decimals: i32;
}

class NoOpPresaver implements TokenPresaver {
  preSaveToken(token: Token): Token {
    return token;
  }
}

export class TokenManager {
  protocol: Bridge;
  initializer: TokenInitializer;
  presaver: TokenPresaver;

  constructor(protocol: Bridge, init: TokenInitializer) {
    this.protocol = protocol;
    this.initializer = init;
    this.presaver = new NoOpPresaver();
  }

  setTokenPresaver(presaver: TokenPresaver): void {
    this.presaver = presaver;
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
    this.presaver.preSaveToken(token);
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

  getOrCreateNonEVMCrosschainToken(
    chainID: BigInt,
    address: Bytes,
    type: string,
    token: Address
  ): CrosschainToken {
    const id = changetype<Bytes>(Bytes.fromBigInt(chainID)).concat(address);
    let ct = CrosschainToken.load(id);
    if (ct) {
      return ct;
    }

    const base = this.getOrCreateToken(token);
    ct = new CrosschainToken(id);
    ct.chainID = chainID;
    ct.network = chainIDToNetwork(chainID);
    ct.address = address;
    ct.type = type;
    ct.token = base.id;
    ct.save();
    return ct;
  }

  getOrCreateCrosschainToken(
    chainID: BigInt,
    address: Address,
    type: string,
    token: Address
  ): CrosschainToken {
    const id = changetype<Bytes>(Bytes.fromBigInt(chainID)).concat(address);
    let ct = CrosschainToken.load(id);
    if (ct) {
      return ct;
    }

    const base = this.getOrCreateToken(token);
    ct = new CrosschainToken(id);
    ct.chainID = chainID;
    ct.network = chainIDToNetwork(chainID);
    ct.address = address;
    ct.type = type;
    ct.token = base.id;
    ct.save();
    return ct;
  }

  registerSupportedToken(address: Address): void {
    let token = SupportedToken.load(address);
    if (token) {
      return;
    }

    token = new SupportedToken(address);
    token.save();
    this.protocol.addSupportedToken();
  }
}
