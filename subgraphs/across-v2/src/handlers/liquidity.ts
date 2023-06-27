import { Address, BigInt, Bytes, log } from "@graphprotocol/graph-ts";
import {
  HubPool,
  LiquidityAdded,
  LiquidityRemoved,
} from "../../generated/HubPool/HubPool";
import { SDK } from "../sdk/protocols/bridge";
import { BridgePoolType } from "../sdk/protocols/bridge/enums";
import {
  ACROSS_HUB_POOL_CONTRACT,
  MAINNET_BRIDGE_CONFIG,
  Pricer,
  TokenInit,
  getTokenBalance,
} from "../util";
import { _OutputTokenToPool } from "../../generated/schema";
import { _ERC20 } from "../../generated/SpokePool1/_ERC20";
import { bigIntToBigDecimal } from "../sdk/util/numbers";
import { BIGINT_ZERO } from "../prices/common/constants";

export function handleLiquidityAdded(event: LiquidityAdded): void {
  const tokenPricer = new Pricer(event.block);
  const sdk = SDK.initializeFromEvent(
    MAINNET_BRIDGE_CONFIG,
    tokenPricer,
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
  const poolId = event.params.l1Token.concat(Bytes.fromUTF8("liquidity"));
  const pool = sdk.Pools.loadPool<string>(poolId);

  if (!pool.isInitialized) {
    pool.initialize(token.name, token.symbol, BridgePoolType.LIQUIDITY, token);
    pool.pool.outputToken = outputToken.id;
    pool.save();
  }

  // output token supply
  let outputTokenSupply: BigInt;
  const erc20 = _ERC20.bind(outputTokenAddress);
  const outputTokenSupplyResult = erc20.try_totalSupply();
  if (outputTokenSupplyResult.reverted) {
    log.info(
      "[_ERC20:tokenSupply()] retrieve outputTokenSupply for LP pool call reverted",
      []
    );
  } else {
    outputTokenSupply = outputTokenSupplyResult.value;
    pool.setOutputTokenSupply(outputTokenSupply);
  }

  // output token price
  if (event.params.lpTokensMinted > BIGINT_ZERO) {
    const exchangeRate = bigIntToBigDecimal(event.params.amount).div(
      bigIntToBigDecimal(event.params.lpTokensMinted)
    );
    pool.pool.outputTokenPriceUSD = tokenPricer
      .getTokenPrice(token)
      .times(exchangeRate);
    pool.save();
  }

  // account
  const amount = event.params.amount;
  const account = sdk.Accounts.loadAccount(event.params.liquidityProvider);
  account.liquidityDeposit(pool, amount);

  // tvl
  pool.setInputTokenBalance(
    getTokenBalance(event.params.l1Token, event.address)
  );

  // output token to pool mapping (required for staking handler)
  let outputTokenToPool = _OutputTokenToPool.load(outputToken.id);
  if (!outputTokenToPool) {
    outputTokenToPool = new _OutputTokenToPool(outputToken.id);
    outputTokenToPool.token = outputToken.id;
    outputTokenToPool.pool = pool.pool.id;
    outputTokenToPool.save();
  }
}

export function handleLiquidityRemoved(event: LiquidityRemoved): void {
  const tokenPricer = new Pricer(event.block);
  const sdk = SDK.initializeFromEvent(
    MAINNET_BRIDGE_CONFIG,
    tokenPricer,
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
  const poolId = event.params.l1Token.concat(Bytes.fromUTF8("liquidity"));
  const pool = sdk.Pools.loadPool<string>(poolId);

  if (!pool.isInitialized) {
    pool.initialize(token.name, token.symbol, BridgePoolType.LIQUIDITY, token);
    pool.pool.outputToken = outputToken.id;
    pool.save();
  }

  // output token supply
  let outputTokenSupply: BigInt;
  const erc20 = _ERC20.bind(outputTokenAddress);
  const outputTokenSupplyResult = erc20.try_totalSupply();
  if (outputTokenSupplyResult.reverted) {
    log.info(
      "[_ERC20:tokenSupply()] retrieve outputTokenSupply for LP pool call reverted",
      []
    );
  } else {
    outputTokenSupply = outputTokenSupplyResult.value;
    pool.setOutputTokenSupply(outputTokenSupply);
  }

  // output token price
  if (event.params.lpTokensBurnt > BIGINT_ZERO) {
    const exchangeRate = bigIntToBigDecimal(event.params.amount).div(
      bigIntToBigDecimal(event.params.lpTokensBurnt)
    );

    pool.pool.outputTokenPriceUSD = tokenPricer
      .getTokenPrice(token)
      .times(exchangeRate);
    pool.save();
  }

  // account
  const amount = event.params.amount;
  const account = sdk.Accounts.loadAccount(event.params.liquidityProvider);
  account.liquidityWithdraw(pool, amount);

  // tvl
  pool.setInputTokenBalance(
    getTokenBalance(event.params.l1Token, event.address)
  );

  // output token to pool mapping
  let outputTokenToPool = _OutputTokenToPool.load(outputToken.id);
  if (!outputTokenToPool) {
    outputTokenToPool = new _OutputTokenToPool(outputToken.id);
    outputTokenToPool.token = outputToken.id;
    outputTokenToPool.pool = pool.pool.id;
    outputTokenToPool.save();
  }
}
