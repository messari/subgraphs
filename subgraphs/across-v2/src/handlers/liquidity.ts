import { Bytes } from "@graphprotocol/graph-ts";
import {
  LiquidityAdded,
  LiquidityRemoved,
} from "../../generated/HubPool/HubPool";
import { SDK } from "../sdk/protocols/bridge";
import { BridgeConfig } from "../sdk/protocols/bridge/config";
import {
  BridgePermissionType,
  BridgePoolType,
} from "../sdk/protocols/bridge/enums";
import { Versions } from "../versions";
import { Pricer, TokenInit } from "./common";

const conf = new BridgeConfig(
  "0xc186fA914353c44b2E33eBE05f21846F1048bEda", // hub-pool address
  "across-v2", //NetworkConfigs.getProtocolName(),
  "across-v2", // NetworkConfigs.getProtocolSlug(),
  BridgePermissionType.WHITELIST, // TBD
  Versions
);

// TODO: further scope to reduce duplication - only different parameter is lpTokensMinted vs lpTokensBurned
export function handleLiquidityAdded(event: LiquidityAdded): void {
  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(event.block),
    new TokenInit(),
    event
  );
  const token = sdk.Tokens.getOrCreateToken(event.params.l1Token);
  const poolId = event.address
    .toHexString()
    .concat(event.params.l1Token.toHexString());

  const pool = sdk.Pools.loadPool<string>(Bytes.fromUTF8(poolId));
  if (!pool.isInitialized) {
    pool.initialize(token.name, token.symbol, BridgePoolType.LIQUIDITY, token);
  }

  const amount = event.params.amount;
  const account = sdk.Accounts.loadAccount(event.params.liquidityProvider);

  // TODO: liquidityDeposit.from is set to poolId, expected?
  // TODO: should pool name and symbol be "Pool - Token" (Eg HubPool - Wrapped Ether)? Doesn't matter since there is only a single liquidity pool in ethereum anyway.
  account.liquidityDeposit(pool, amount);
}

export function handleLiquidityRemoved(event: LiquidityRemoved): void {
  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(event.block),
    new TokenInit(),
    event
  );
  const token = sdk.Tokens.getOrCreateToken(event.params.l1Token);
  const poolId = event.address
    .toHexString()
    .concat(event.params.l1Token.toHexString());

  const pool = sdk.Pools.loadPool<string>(Bytes.fromUTF8(poolId));
  if (!pool.isInitialized) {
    pool.initialize(token.name, token.symbol, BridgePoolType.LIQUIDITY, token);
  }

  const amount = event.params.amount;
  const account = sdk.Accounts.loadAccount(event.params.liquidityProvider);

  account.liquidityWithdraw(pool, amount);
}
