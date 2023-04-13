import { Address, Bytes, log } from "@graphprotocol/graph-ts";
import {
  HubPool,
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
import {
  ACROSS_HUB_POOL_CONTRACT,
  ACROSS_PROTOCOL_NAME,
  Pricer,
  TokenInit,
} from "../util";
// import { BIGINT_MINUS_ONE } from "../sdk/util/constants";

const conf = new BridgeConfig(
  ACROSS_HUB_POOL_CONTRACT,
  ACROSS_PROTOCOL_NAME,
  ACROSS_PROTOCOL_NAME,
  BridgePermissionType.WHITELIST,
  Versions
);

export function handleLiquidityAdded(event: LiquidityAdded): void {
  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(event.block),
    new TokenInit(),
    event
  );

  // input token
  const token = sdk.Tokens.getOrCreateToken(event.params.l1Token);

  // pool
  const poolId = event.address
    .toHexString()
    .concat(event.params.l1Token.toHexString());
  const pool = sdk.Pools.loadPool<string>(Bytes.fromUTF8(poolId));
  if (!pool.isInitialized) {
    pool.initialize(token.name, token.symbol, BridgePoolType.LIQUIDITY, token);
  }

  // output token
  const hubPoolContract = HubPool.bind(
    Address.fromString(ACROSS_HUB_POOL_CONTRACT)
  );
  const hubPoolContractCall = hubPoolContract.try_pooledTokens(
    event.params.l1Token
  );
  let outputTokenAddress: Address;
  if (hubPoolContractCall.reverted) {
    log.info("[HubPool:pooledTokens()] get LP Token call reverted", []);
    outputTokenAddress = event.params.l1Token;
  } else {
    outputTokenAddress = hubPoolContractCall.value.getLpToken();
  }
  // const outputToken = sdk.Tokens.getOrCreateToken(outputTokenAddress);
  // pool.addOutputTokenSupply(event.params.lpTokensMinted);

  // account
  const amount = event.params.amount;
  const account = sdk.Accounts.loadAccount(event.params.liquidityProvider);
  account.liquidityDeposit(pool, amount);
}

export function handleLiquidityRemoved(event: LiquidityRemoved): void {
  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(event.block),
    new TokenInit(),
    event
  );

  // input token
  const token = sdk.Tokens.getOrCreateToken(event.params.l1Token);

  // pool
  const poolId = event.address
    .toHexString()
    .concat(event.params.l1Token.toHexString());
  const pool = sdk.Pools.loadPool<string>(Bytes.fromUTF8(poolId));
  if (!pool.isInitialized) {
    pool.initialize(token.name, token.symbol, BridgePoolType.LIQUIDITY, token);
  }

  // output token
  const hubPoolContract = HubPool.bind(
    Address.fromString(ACROSS_HUB_POOL_CONTRACT)
  );
  const hubPoolContractCall = hubPoolContract.try_pooledTokens(
    event.params.l1Token
  );
  let outputTokenAddress: Address;
  if (hubPoolContractCall.reverted) {
    log.info("[HubPool:pooledTokens()] get LP Token call reverted", []);
    outputTokenAddress = event.params.l1Token;
  } else {
    outputTokenAddress = hubPoolContractCall.value.getLpToken();
  }
  // const outputToken = sdk.Tokens.getOrCreateToken(outputTokenAddress);
  // pool.addOutputTokenSupply(event.params.lpTokensBurnt.times(BIGINT_MINUS_ONE)); // TODO: verify does plus(minus_amount) work?

  // account
  const amount = event.params.amount;
  const account = sdk.Accounts.loadAccount(event.params.liquidityProvider);
  account.liquidityWithdraw(pool, amount);
}
