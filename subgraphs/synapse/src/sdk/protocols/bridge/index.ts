import { ethereum } from "@graphprotocol/graph-ts";

import { AccountManager } from "./account";
import { Bridge } from "./protocol";
import { PoolManager } from "./pool";
import { TokenPricer } from "../config";
import { BridgeConfigurer } from "./config";

export class SDK {
  protocol: Bridge;
  accounts: AccountManager;
  pools: PoolManager;

  constructor(
    conf: BridgeConfigurer,
    pricer: TokenPricer,
    event: ethereum.Event
  ) {
    this.protocol = Bridge.load(conf, pricer, event);
    this.accounts = new AccountManager(this.protocol);
    this.pools = new PoolManager(this.protocol);
  }
}
