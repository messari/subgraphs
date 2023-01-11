import { ethereum } from "@graphprotocol/graph-ts";

import { ProtocolManager } from "./protocol";
import { EventsManager } from "./event";
import { PoolsManager } from "./pool";
import { AccountsManager } from "./account";
import { TokensManager, TokenInitializer } from "./token";
import { TokenPricer } from "../config";
import { Config } from "./config";

export class SDK {
  ProtocolManager: ProtocolManager;
  PoolsManager: PoolsManager;
  EventsManager: EventsManager;
  AccountsManager: AccountsManager;
  TokensManager: TokensManager;
  Pricer: TokenPricer;
  event: ethereum.Event;

  constructor(
    config: Config,
    pricer: TokenPricer,
    tokenInitializer: TokenInitializer,
    event: ethereum.Event
  ) {
    this.ProtocolManager = new ProtocolManager(config, event);
    this.TokensManager = new TokensManager(
      this.ProtocolManager,
      pricer,
      tokenInitializer
    );
    this.AccountsManager = new AccountsManager(this.ProtocolManager);
    this.PoolsManager = new PoolsManager(this.ProtocolManager);
    this.EventsManager = new EventsManager(
      this.PoolsManager,
      this.TokensManager
    );
    this.event = event;
  }

  create_pool() {
    this.TokensManager;
  }

  update_balances(
    type: Enum,
    rawDeltas: RawDeltas,
    poolAddress: string | null
  ): void {
    const allDeltas = this.EventsManager.generate(rawDeltas);
    this.EventsManager.create_swap(poolAddress, this.event, allDeltas);
    this.PoolsManager.update_on_event(
      this.event,
      poolAddress,
      allDeltas
    ).take_snapshot();
    this.TokensManager.update_on_event(
      this.event,
      poolAddress,
      allDeltas
    ).take_snapshot();
    this.ProtocolManager.update_on_event(this.event, allDeltas).take_snapshot();
    this.AccountsManager.update_on_event(this.event, allDeltas);
  }
}
