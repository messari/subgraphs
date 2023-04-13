/* eslint-disable rulesdir/no-non-standard-filenames */
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
  protocol: Bridge;
  accounts: AccountManager;
  pools: PoolManager;
  tokens: TokenManager;
  pricer: TokenPricer;

  constructor(
    config: BridgeConfigurer,
    pricer: TokenPricer,
    tokenInitializer: TokenInitializer,
    event: CustomEventType
  ) {
    this.protocol = Bridge.load(config, pricer, event);
    this.tokens = new TokenManager(this.protocol, tokenInitializer);
    this.accounts = new AccountManager(this.protocol, this.tokens);
    this.pools = new PoolManager(this.protocol, this.tokens);
    this.pricer = pricer;

    this.protocol.sdk = this;
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
