import { Address, BigInt, Bytes, ethereum } from "@graphprotocol/graph-ts";

import { AccountManager } from "./account";
import { Bridge } from "./protocol";
import { PoolManager } from "./pool";
import { TokenPricer } from "../config";
import { BridgeConfigurer } from "./config";
import { TokenManager, TokenInitializer } from "./tokens";
import { BIGINT_ZERO, ZERO_ADDRESS } from "../../util/constants";

export class CustomEventType {
  block: ethereum.Block;
  transaction: ethereum.Transaction;
  logIndex: BigInt;
  address: Address;
  event: ethereum.Event | null;

  constructor() {
    this.block = new ethereum.Block(
      Bytes.empty(),
      Bytes.empty(),
      Bytes.empty(),
      Address.fromString(ZERO_ADDRESS),
      Bytes.empty(),
      Bytes.empty(),
      Bytes.empty(),
      BIGINT_ZERO,
      BIGINT_ZERO,
      BIGINT_ZERO,
      BIGINT_ZERO,
      BIGINT_ZERO,
      BIGINT_ZERO,
      null,
      null
    );
    this.transaction = new ethereum.Transaction(
      Bytes.empty(),
      BIGINT_ZERO,
      Address.fromString(ZERO_ADDRESS),
      null,
      BIGINT_ZERO,
      BIGINT_ZERO,
      BIGINT_ZERO,
      Bytes.empty(),
      BIGINT_ZERO
    );
    this.logIndex = BIGINT_ZERO;
    this.address = Address.zero();
    this.event = null;
  }

  static initialize(
    block: ethereum.Block,
    transaction: ethereum.Transaction,
    logIndex: BigInt,
    address: Address,
    event: ethereum.Event | null = null
  ): CustomEventType {
    const customEvent = new CustomEventType();
    customEvent.block = block;
    customEvent.transaction = transaction;
    customEvent.logIndex = logIndex;
    customEvent.address = address;
    customEvent.event = event;

    return customEvent;
  }
}

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
