import { BigInt, ethereum } from "@graphprotocol/graph-ts";

import { AccountManager } from "./account";
import { Bridge } from "./protocol";
import { PoolManager } from "./pool";
import { TokenPricer } from "../config";
import { BridgeConfigurer } from "./config";
import { TokenManager, TokenInitializer } from "./tokens";

export class CustomEventType {
  block: ethereum.Block;
  transaction: ethereum.Transaction;
  logIndex: BigInt;
  event: ethereum.Event | null;

  private constructor(
    block: ethereum.Block,
    transaction: ethereum.Transaction,
    logIndex: BigInt,
    event: ethereum.Event | null
  ) {
    this.block = block;
    this.transaction = transaction;
    this.logIndex = logIndex;
    this.event = event;
  }

  static initialize(
    block: ethereum.Block,
    transaction: ethereum.Transaction,
    logIndex: BigInt,
    event: ethereum.Event | null = null
  ): CustomEventType {
    return new CustomEventType(block, transaction, logIndex, event);
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
    params: CustomEventType
  ) {
    this.Protocol = Bridge.load(config, pricer, params.block);
    this.Tokens = new TokenManager(this.Protocol, tokenInitializer);
    this.Accounts = new AccountManager(
      this.Protocol,
      this.Tokens,
      params.transaction,
      params.logIndex
    );
    this.Pools = new PoolManager(this.Protocol, this.Tokens);
    this.Pricer = pricer;

    this.Protocol.sdk = this;
  }
}
