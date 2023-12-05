import { ethereum } from "@graphprotocol/graph-ts";

import { AccountManager } from "./account";
import { Bridge } from "./protocol";
import { PoolManager } from "./pool";
import { TokenPricer } from "../config";
import { BridgeConfigurer } from "./config";
import { TokenManager, TokenInitializer } from "./tokens";
import { BIGINT_ZERO } from "../../util/constants";
import { CustomEventType } from "../../util/events";

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
    event: CustomEventType
  ) {
    this.Protocol = Bridge.load(config, pricer, event);
    this.Tokens = new TokenManager(this.Protocol, tokenInitializer);
    this.Accounts = new AccountManager(this.Protocol, this.Tokens);
    this.Pools = new PoolManager(this.Protocol, this.Tokens);
    this.Pricer = pricer;

    this.Protocol.sdk = this;
  }

  static initializeFromEvent(
    config: BridgeConfigurer,
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
    config: BridgeConfigurer,
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

  /**
   * @deprecated https://github.com/messari/subgraphs/pull/1595: Use initializeFromEvent or initializeFromCall instead
   */
  static initialize<T>(
    config: BridgeConfigurer,
    pricer: TokenPricer,
    tokenInitializer: TokenInitializer,
    event: T
  ): SDK {
    if (event instanceof ethereum.Event) {
      const customEvent = CustomEventType.initialize(
        event.block,
        event.transaction,
        event.logIndex,
        event
      );
      return new SDK(config, pricer, tokenInitializer, customEvent);
    }
    if (event instanceof ethereum.Call) {
      const customEvent = CustomEventType.initialize(
        event.block,
        event.transaction,
        BIGINT_ZERO
      );
      return new SDK(config, pricer, tokenInitializer, customEvent);
    }
    return new SDK(config, pricer, tokenInitializer, new CustomEventType());
  }
}
