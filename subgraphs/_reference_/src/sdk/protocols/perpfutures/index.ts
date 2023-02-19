import { PoolManager } from "./pool";
import { Position } from "./position";
import { Perpetual } from "./protocol";
import { AccountManager } from "./account";
import * as constants from "../../util/constants";
import { ethereum } from "@graphprotocol/graph-ts";
import { CustomEventType } from "../../util/events";
import { TokenInitializer, TokenManager } from "./tokens";
import { ProtocolConfigurer, TokenPricer } from "../config";

export class SDK {
  Protocol: Perpetual;
  Accounts: AccountManager;
  Pools: PoolManager;
  Position: Position;
  Tokens: TokenManager;
  Pricer: TokenPricer;

  constructor(
    config: ProtocolConfigurer,
    pricer: TokenPricer,
    tokenInitializer: TokenInitializer,
    event: CustomEventType
  ) {
    this.Protocol = Perpetual.load(config, pricer, event);
    this.Tokens = new TokenManager(this.Protocol, tokenInitializer);
    this.Accounts = new AccountManager(this.Protocol, this.Tokens);
    this.Pools = new PoolManager(this.Protocol, this.Tokens);
    this.Position = new Position(this.Protocol, this.Tokens);
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
      constants.BIGINT_ZERO
    );
    return new SDK(config, pricer, tokenInitializer, customEvent);
  }
}
