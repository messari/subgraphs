import { SDK } from "../../../../src/sdk/protocols/bridge";
import { TokenPricer } from "../../../../src/sdk/protocols/config";
import {
  TokenInitializer,
  TokenParams,
} from "../../../../src/sdk/protocols/bridge/tokens";
import { BridgePoolType } from "../../../../src/sdk/protocols/bridge/enums";

import { NetworkConfigs } from "../../../../configurations/configure";
import {
  Address,
  BigDecimal,
  BigInt,
  log,
  Bytes,
} from "@graphprotocol/graph-ts";
import {
  TokenSwap,
  AddLiquidity,
  RemoveLiquidity,
  RemoveLiquidityOne,
} from "../../../../generated/HopL2Amm/L2_Amm";
import { Token } from "../../../../generated/schema";
import { getUsdPricePerToken, getUsdPrice } from "../../../../src/prices/index";
import { bigIntToBigDecimal } from "../../../../src/sdk/util/numbers";
import {
  BIGINT_FOUR,
  BIGINT_TEN_THOUSAND,
  BIGINT_TEN_TO_EIGHTEENTH,
  FOUR,
  SIX,
  THREE,
} from "../../../../src/sdk/util/constants";
import { updateAMMTVE } from "../../../../src/sdk/util/tokens";
import { conf } from "../../../../src/sdk/util/bridge";

class Pricer implements TokenPricer {
  getTokenPrice(token: Token): BigDecimal {
    const price = getUsdPricePerToken(Address.fromBytes(token.id));
    return price.usdPrice;
  }

  getAmountValueUSD(token: Token, amount: BigInt): BigDecimal {
    const _amount = bigIntToBigDecimal(amount, token.decimals);
    return getUsdPrice(Address.fromBytes(token.id), _amount);
  }
}

class TokenInit implements TokenInitializer {
  getTokenParams(address: Address): TokenParams {
    const tokenConfig = NetworkConfigs.getTokenDetails(address.toHex());

    if (tokenConfig.length != FOUR) {
      log.error("Invalid tokenConfig length", []);
    }

    const name = tokenConfig[1];
    const symbol = tokenConfig[0];
    const decimals = BigInt.fromString(tokenConfig[2]).toI32();
    return { name, symbol, decimals };
  }
}

export function handleTokenSwap(event: TokenSwap): void {
  if (!NetworkConfigs.getPoolsList().includes(event.address.toHexString())) {
    log.error("Missing Config", []);
    return;
  }
  const amount = event.params.tokensSold;

  const fees = amount.times(BIGINT_FOUR).div(BIGINT_TEN_THOUSAND);

  log.info("FEES 2- fees: {}, fees: {}, amount: {}", [
    fees.toBigDecimal().toString(),
    fees.toString(),
    amount.toString(),
  ]);

  const inputToken = NetworkConfigs.getTokenAddressFromPoolAddress(
    event.address.toHexString()
  );
  if (inputToken.length != 2) {
    log.error("Invalid InputToken length", []);
    return;
  }
  const inputTokenOne = inputToken[0];
  const inputTokenTwo = inputToken[1];

  const poolConfig = NetworkConfigs.getPoolDetails(event.address.toHexString());
  if (poolConfig.length != THREE) {
    log.error("Invalid PoolConfig length", []);
    return;
  }

  const poolName = poolConfig[1];
  const poolSymbol = poolConfig[0];
  const hPoolName = poolConfig[2];

  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );

  const pool = sdk.Pools.loadPool<string>(event.address);
  const hPool = sdk.Pools.loadPool<string>(
    Bytes.fromHexString(event.address.toHexString().concat("-").concat("1"))
  );

  const tokenOne = sdk.Tokens.getOrCreateToken(
    Address.fromString(inputTokenOne)
  );
  const tokenTwo = sdk.Tokens.getOrCreateToken(
    Address.fromString(inputTokenTwo)
  );

  sdk.Accounts.loadAccount(event.params.buyer);

  if (!pool.isInitialized) {
    pool.initialize(poolName, poolSymbol, BridgePoolType.LIQUIDITY, tokenOne);
  }
  if (!hPool.isInitialized) {
    hPool.initialize(hPoolName, poolSymbol, BridgePoolType.LIQUIDITY, tokenTwo);
  }

  updateAMMTVE(event.address, Address.fromBytes(tokenOne.id), hPool, pool);

  pool.pool.relation = hPool.getBytesID();
  hPool.pool.relation = hPool.getBytesID();

  pool.addRevenueNative(BigInt.zero(), fees);
}

export function handleAddLiquidity(event: AddLiquidity): void {
  if (!NetworkConfigs.getPoolsList().includes(event.address.toHexString())) {
    log.error("Missing Config", []);
    return;
  }
  const amount = event.params.tokenAmounts;
  if (amount.length == 0) {
    return;
  }
  const liquidity = amount[0].plus(amount[1]);

  const inputToken = NetworkConfigs.getTokenAddressFromPoolAddress(
    event.address.toHexString()
  );
  if (inputToken.length != 2) {
    log.error("Invalid InputToken length", []);
    return;
  }
  const inputTokenOne = inputToken[0];
  const inputTokenTwo = inputToken[1];

  const poolConfig = NetworkConfigs.getPoolDetails(event.address.toHexString());
  if (poolConfig.length != THREE) {
    log.error("Invalid PoolConfig length", []);
    return;
  }

  const poolName = poolConfig[1];
  const hPoolName = poolConfig[2];
  const poolSymbol = poolConfig[0];

  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );

  const pool = sdk.Pools.loadPool<string>(event.address);
  const token = sdk.Tokens.getOrCreateToken(Address.fromString(inputTokenOne));
  const hToken = sdk.Tokens.getOrCreateToken(Address.fromString(inputTokenTwo));
  const acc = sdk.Accounts.loadAccount(event.params.provider);
  const hPool = sdk.Pools.loadPool<string>(
    Bytes.fromHexString(event.address.toHexString().concat("-").concat("1"))
  );

  if (!pool.isInitialized) {
    pool.initialize(poolName, poolSymbol, BridgePoolType.LIQUIDITY, token);
  }
  if (!hPool.isInitialized) {
    hPool.initialize(hPoolName, poolSymbol, BridgePoolType.LIQUIDITY, hToken);
  }

  //Optimism had a regenesis so we need to manually set the pool's liquidity balance
  if (
    event.transaction.hash.toHexString() ==
    "0xb164734917a3ab5987544d99f6a5875a95bbb30d57c30dfec8db8d13789490ee"
  ) {
    pool.pool._inputTokenLiquidityBalance = event.params.lpTokenSupply.div(
      BIGINT_TEN_TO_EIGHTEENTH
    );
  }

  pool.setOutputTokenSupply(event.params.lpTokenSupply);
  hPool.setOutputTokenSupply(event.params.lpTokenSupply);

  acc.liquidityDeposit(pool, liquidity);

  pool.pool.relation = hPool.getBytesID();
  hPool.pool.relation = hPool.getBytesID();

  updateAMMTVE(event.address, Address.fromBytes(token.id), hPool, pool);

  log.info(
    `LA ${token.id.toHexString()} - lpTokenSupply: {}, amount: {}, hash: {},  feeUsd: {}`,
    [
      bigIntToBigDecimal(event.params.lpTokenSupply).toString(),
      bigIntToBigDecimal(liquidity, SIX).toString(),
      event.transaction.hash.toHexString(),
      bigIntToBigDecimal(event.params.fees[0], SIX).toString(),
    ]
  );
}
export function handleRemoveLiquidity(event: RemoveLiquidity): void {
  if (!NetworkConfigs.getPoolsList().includes(event.address.toHexString())) {
    log.error("Missing Config", []);
    return;
  }
  const amount = event.params.tokenAmounts;
  if (amount.length == 0) {
    return;
  }

  const liquidity = amount[0].plus(amount[1]);

  const inputToken = NetworkConfigs.getTokenAddressFromPoolAddress(
    event.address.toHexString()
  );
  if (inputToken.length != 2) {
    log.error("Invalid InputToken length", []);
    return;
  }
  const inputTokenOne = inputToken[0];
  const inputTokenTwo = inputToken[1];

  const poolConfig = NetworkConfigs.getPoolDetails(event.address.toHexString());
  if (poolConfig.length != THREE) {
    log.error("Invalid PoolConfig length", []);
    return;
  }

  const poolName = poolConfig[1];
  const poolSymbol = poolConfig[0];
  const hPoolName = poolConfig[2];

  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );

  const pool = sdk.Pools.loadPool<string>(event.address);
  const token = sdk.Tokens.getOrCreateToken(Address.fromString(inputTokenOne));
  const hToken = sdk.Tokens.getOrCreateToken(Address.fromString(inputTokenTwo));
  const acc = sdk.Accounts.loadAccount(event.params.provider);
  const hPool = sdk.Pools.loadPool<string>(
    Bytes.fromHexString(
      event.address.toHexString().toLowerCase().concat("-").concat("1")
    )
  );
  if (!pool.isInitialized) {
    pool.initialize(poolName, poolSymbol, BridgePoolType.LIQUIDITY, token);
  }

  if (!hPool.isInitialized) {
    hPool.initialize(hPoolName, poolSymbol, BridgePoolType.LIQUIDITY, hToken);
  }

  pool.setOutputTokenSupply(event.params.lpTokenSupply);
  hPool.setOutputTokenSupply(event.params.lpTokenSupply);

  acc.liquidityWithdraw(pool, liquidity);

  updateAMMTVE(event.address, Address.fromBytes(token.id), hPool, pool);

  pool.pool.relation = hPool.getBytesID();
  hPool.pool.relation = hPool.getBytesID();

  log.info(
    "LWITH lpTokenSupply: {}, amount6-0: {}, amount18-0: {}, amount6-1: {}, amount18-1: {}, hash: {}",
    [
      bigIntToBigDecimal(event.params.lpTokenSupply).toString(),
      bigIntToBigDecimal(amount[0], SIX).toString(),
      bigIntToBigDecimal(amount[0]).toString(),
      bigIntToBigDecimal(amount[1], SIX).toString(),
      bigIntToBigDecimal(amount[1]).toString(),
      event.transaction.hash.toHexString(),
    ]
  );
}

export function handleRemoveLiquidityOne(event: RemoveLiquidityOne): void {
  if (!NetworkConfigs.getPoolsList().includes(event.address.toHexString())) {
    log.error("Missing Config", []);
    return;
  }
  log.info("LWITHONE lpTokenSupply: {}, amount: {}, txHash: {}", [
    event.params.lpTokenSupply.toString(),
    event.transaction.hash.toHexString(),
    bigIntToBigDecimal(event.params.lpTokenAmount).toString(),
  ]);

  const tokenIndex = event.params.boughtId;
  if (!tokenIndex.equals(BigInt.zero())) {
    return;
  }

  const amount = event.params.lpTokenAmount.div(BigInt.fromI32(2));

  const inputToken = NetworkConfigs.getTokenAddressFromPoolAddress(
    event.address.toHexString()
  );
  if (inputToken.length != 2) {
    log.error("Invalid InputToken length", []);
    return;
  }
  const inputTokenOne = inputToken[0];
  const inputTokenTwo = inputToken[1];

  const poolConfig = NetworkConfigs.getPoolDetails(event.address.toHexString());
  if (poolConfig.length != THREE) {
    log.error("Invalid PoolConfig length", []);
    return;
  }

  const poolName = poolConfig[1];
  const hPoolName = poolConfig[2];
  const poolSymbol = poolConfig[0];

  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );

  const pool = sdk.Pools.loadPool<string>(event.address);
  const token = sdk.Tokens.getOrCreateToken(Address.fromString(inputTokenOne));
  const hToken = sdk.Tokens.getOrCreateToken(Address.fromString(inputTokenTwo));
  const acc = sdk.Accounts.loadAccount(event.params.provider);

  const hPool = sdk.Pools.loadPool<string>(
    Bytes.fromHexString(event.address.toHexString().concat("-").concat("1"))
  );
  if (!pool.isInitialized) {
    pool.initialize(poolName, poolSymbol, BridgePoolType.LIQUIDITY, token);
  }

  if (!hPool.isInitialized) {
    hPool.initialize(hPoolName, poolSymbol, BridgePoolType.LIQUIDITY, hToken);
  }

  pool.setOutputTokenSupply(event.params.lpTokenSupply);
  hPool.setOutputTokenSupply(event.params.lpTokenSupply);

  acc.liquidityWithdraw(pool, amount.div(BIGINT_TEN_TO_EIGHTEENTH));

  updateAMMTVE(event.address, Address.fromBytes(token.id), hPool, pool);

  pool.pool.relation = hPool.getBytesID();
  hPool.pool.relation = hPool.getBytesID();

  log.info("LWITHONE lpTokenSupply: {}, amount: {}, txHash: {}", [
    event.params.lpTokenSupply.toString(),
    bigIntToBigDecimal(event.params.lpTokenAmount).toString(),
    event.transaction.hash.toHexString(),
  ]);
}
