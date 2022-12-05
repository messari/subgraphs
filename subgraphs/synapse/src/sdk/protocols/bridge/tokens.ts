import { Address, Bytes } from "@graphprotocol/graph-ts";

import { ERC20 } from "../../../../generated/Synapse/ERC20";

import { Token } from "../../../../generated/schema";
import { CrosschainToken } from "../../../../generated/schema";

export class Tokens {
  static initToken(address: Address): Token {
    let token = Token.load(address);
    if (token) {
      return token;
    }

    const sc = ERC20.bind(address);
    token = new Token(address);
    token.name = sc.name();
    token.symbol = sc.symbol();
    token.decimals = sc.decimals();
    token.save();
    return token;
  }

  static initCrosschainToken(
    chainID: i32,
    address: Address,
    type: string,
    token: Address
  ): CrosschainToken {
    const id = Bytes.fromI32(chainID).concat(address);
    let ct = CrosschainToken.load(id);
    if (ct) {
      return ct;
    }

    const base = Tokens.initToken(token);
    ct = new CrosschainToken(id);
    ct.chainID = chainID;
    ct.network = chainIDToNetwork(chainID);
    ct.address = address;
    ct.type = type;
    ct.token = base.id;
    ct.save();
    return ct;
  }
}

export function chainIDToNetwork(chainID: i32): string {
  // todo
  return "MAINNET";
}
