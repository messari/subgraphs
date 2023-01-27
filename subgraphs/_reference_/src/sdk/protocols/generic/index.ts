import { ethereum } from "@graphprotocol/graph-ts";

import { AccountManager } from "./account";
import { ProtocolManager } from "./protocol";
import { PoolManager } from "./pool";
import { ProtocolConfigurer, TokenPricer } from "../config";
import { TokenManager, TokenInitializer } from "./tokens";
import { BIGINT_ZERO } from "../../util/constants";
import { CustomEventType } from "../../util/events";

export class SDK {
  Protocol: ProtocolManager;
  Accounts: AccountManager;
  Pools: PoolManager;
  Tokens: TokenManager;
  Pricer: TokenPricer;

  constructor(
    config: ProtocolConfigurer,
    pricer: TokenPricer,
    tokenInitializer: TokenInitializer,
    event: CustomEventType
  ) {
    this.Protocol = ProtocolManager.load(config, pricer, event);
    this.Tokens = new TokenManager(this.Protocol, tokenInitializer);
    this.Accounts = new AccountManager(this.Protocol, this.Tokens);
    this.Pools = new PoolManager(this.Protocol, this.Tokens);
    this.Pricer = pricer;

    this.Protocol.sdk = this;
  }

  static initializeFromEvent(
    config: ProtocolConfigurer,
    pricer: TokenPricer,
    tokenInitializer: TokenInitializer,
    event: ethereum.Event
  ): SDK {
    const customEvent = CustomEventType.initialize(
      event.block,
      event.transaction,
      event.logIndex,
      event
    );
    return new SDK(config, pricer, tokenInitializer, customEvent);
  }

  static initializeFromCall(
    config: ProtocolConfigurer,
    pricer: TokenPricer,
    tokenInitializer: TokenInitializer,
    event: ethereum.Call
  ): SDK {
    const customEvent = CustomEventType.initialize(
      event.block,
      event.transaction,
      BIGINT_ZERO
    );
    return new SDK(config, pricer, tokenInitializer, customEvent);
  }
}
