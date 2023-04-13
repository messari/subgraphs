/* eslint-disable rulesdir/no-non-standard-filenames */
import { PoolManager } from "./pool";
import { PositionManager } from "./position";
import { Perpetual } from "./protocol";
import { AccountManager } from "./account";
import * as constants from "../../util/constants";
import { CustomEventType } from "../../util/events";
import { TokenInitializer, TokenManager } from "./tokens";
import { ProtocolConfigurer, TokenPricer } from "../config";

export class SDK {
  protocol: Perpetual;
  accounts: AccountManager;
  pools: PoolManager;
  position: Position;
  tokens: TokenManager;
  pricer: TokenPricer;

  constructor(
    config: ProtocolConfigurer,
    pricer: TokenPricer,
    tokenInitializer: TokenInitializer,
    event: CustomEventType
  ) {
    this.protocol = Perpetual.load(config, pricer, event);
    this.tokens = new TokenManager(this.protocol, tokenInitializer);
    this.accounts = new AccountManager(this.protocol, this.tokens);
    this.pools = new PoolManager(this.protocol, this.tokens);
    this.position = new Position(this.protocol, this.tokens);
    this.pricer = pricer;

    this.protocol.sdk = this;
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
      constants.BIGINT_ZERO
    );
    return new SDK(config, pricer, tokenInitializer, customEvent);
  }
}
