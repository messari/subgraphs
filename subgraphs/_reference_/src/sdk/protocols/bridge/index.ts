import { ethereum } from "@graphprotocol/graph-ts";

import { AccountManager } from "./account";
import { Bridge } from "./protocol";
import { PoolManager } from "./pool";
import { TokenPricer } from "../config";
import { BridgeConfigurer } from "./config";
import { TokenManager, TokenInitializer } from "./tokens";

export class SDK {
  Protocol: Bridge;
  Accounts: AccountManager;
  Pools: PoolManager;
  Tokens: TokenManager;
  Pricer: TokenPricer;

  constructor(
    config: BridgeConfigurer,
    pricer: TokenPricer,
    tokenInitializer: TokenInitializer,
    event: ethereum.Event
  ) {
    this.Protocol = Bridge.load(config, pricer, event);
    this.Tokens = new TokenManager(this.Protocol, tokenInitializer);
    this.Accounts = new AccountManager(this.Protocol, this.Tokens);
    this.Pools = new PoolManager(this.Protocol, this.Tokens);
    this.Pricer = pricer;

    this.Protocol.sdk = this;
  }
}
