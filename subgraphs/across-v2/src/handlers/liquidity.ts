import { Address, BigInt, Bytes, log } from "@graphprotocol/graph-ts";
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
import { BIGINT_MINUS_ONE } from "../sdk/util/constants";
import { _ERC20 } from "../../generated/HubPool/_ERC20";

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
  const outputToken = sdk.Tokens.getOrCreateToken(outputTokenAddress);

  // pool
  const poolId = event.address
    .concat(event.params.l1Token)
    .concat(Bytes.fromUTF8("liquidity"));
  const pool = sdk.Pools.loadPool<string>(poolId);

  if (!pool.isInitialized) {
    pool.initialize(
      token.name,
      token.symbol,
      BridgePoolType.LOCK_RELEASE,
      token
    );
    pool.pool.outputToken = outputToken.id;
    pool.pool.save();
  }

  pool.addOutputTokenSupply(event.params.lpTokensMinted);

  // account
  const amount = event.params.amount;
  const account = sdk.Accounts.loadAccount(event.params.liquidityProvider);
  account.liquidityDeposit(pool, amount);

  // tvl
  let inputTokenBalance: BigInt;
  const erc20 = _ERC20.bind(event.params.l1Token);
  const inputTokenBalanceResult = erc20.try_balanceOf(event.address);
  if (inputTokenBalanceResult.reverted) {
    log.info(
      "[ERC20:balanceOf()]calculate token balance owned by bridge contract reverted",
      []
    );
  } else {
    inputTokenBalance = inputTokenBalanceResult.value;
  }
  pool.setInputTokenBalance(inputTokenBalance!);
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
  const outputToken = sdk.Tokens.getOrCreateToken(outputTokenAddress);

  // pool
  const poolId = event.address
    .concat(event.params.l1Token)
    .concat(Bytes.fromUTF8("liquidity"));
  const pool = sdk.Pools.loadPool<string>(poolId);

  if (!pool.isInitialized) {
    pool.initialize(
      token.name,
      token.symbol,
      BridgePoolType.LOCK_RELEASE,
      token
    );
    pool.pool.outputToken = outputToken.id;
    pool.pool.save();
  }

  pool.addOutputTokenSupply(event.params.lpTokensBurnt.times(BIGINT_MINUS_ONE));

  // account
  const amount = event.params.amount;
  const account = sdk.Accounts.loadAccount(event.params.liquidityProvider);
  account.liquidityWithdraw(pool, amount);

  // tvl
  let inputTokenBalance: BigInt;
  const erc20 = _ERC20.bind(event.params.l1Token);
  const inputTokenBalanceResult = erc20.try_balanceOf(event.address);
  if (inputTokenBalanceResult.reverted) {
    log.info(
      "[ERC20:balanceOf()]calculate token balance owned by bridge contract reverted",
      []
    );
  } else {
    inputTokenBalance = inputTokenBalanceResult.value;
  }
  pool.setInputTokenBalance(inputTokenBalance!);
}
