import {
  getOrCreateLpToken,
  getOrCreateLiquidityPool,
  getOrCreateLiquidityGauge,
} from "../common/initializers";
import {
  PoolAdded,
  PoolAdded1,
  BasePoolAdded,
  MetaPoolDeployed,
  PlainPoolDeployed,
  CryptoPoolDeployed,
  LiquidityGaugeDeployed1 as LiquidityGaugeDeployed,
  LiquidityGaugeDeployed as LiquidityGaugeDeployedWithToken,
} from "../../generated/templates/PoolTemplate/Registry";
import * as utils from "../common/utils";
import { Address, log } from "@graphprotocol/graph-ts";

export function handlePoolAdded(event: PoolAdded): void {
  const registryAddress = event.address;
  const poolAddress = event.params.pool;

  if (utils.isPoolRegistered(poolAddress)) return;

  const pool = getOrCreateLiquidityPool(poolAddress, event.block);

  let lpToken = utils.getLpTokenFromRegistry(
    poolAddress,
    registryAddress,
    event.block
  );

  if (!lpToken)
    lpToken = utils.getOrCreateTokenFromString(pool.outputToken!, event.block);

  const lpTokenStore = getOrCreateLpToken(Address.fromString(lpToken.id));

  lpTokenStore.registryAddress = registryAddress.toHexString();
  lpTokenStore.poolAddress = poolAddress.toHexString();

  pool.name = lpToken.name;
  pool.symbol = lpToken.symbol;
  pool.outputToken = lpToken.id;
  pool._registryAddress = registryAddress.toHexString();

  lpTokenStore.save();
  pool.save();

  log.warning("[PoolAdded] PoolAddress: {}, Registry: {}, TxnHash: {}", [
    pool.id,
    registryAddress.toHexString(),
    event.transaction.hash.toHexString(),
  ]);
}

export function handlePoolAddedWithRate(event: PoolAdded1): void {
  const registryAddress = event.address;
  const poolAddress = event.params.pool;

  if (utils.isPoolRegistered(poolAddress)) return;

  const pool = getOrCreateLiquidityPool(poolAddress, event.block);

  let lpToken = utils.getLpTokenFromRegistry(
    poolAddress,
    registryAddress,
    event.block
  );

  if (!lpToken)
    lpToken = utils.getOrCreateTokenFromString(pool.outputToken!, event.block);

  const lpTokenStore = getOrCreateLpToken(Address.fromString(lpToken.id));

  lpTokenStore.registryAddress = registryAddress.toHexString();
  lpTokenStore.poolAddress = poolAddress.toHexString();

  pool._registryAddress = registryAddress.toHexString();
  pool.name = lpToken.name;
  pool.symbol = lpToken.symbol;
  pool.outputToken = lpToken.id;

  lpTokenStore.save();
  pool.save();

  log.warning("[PoolAdded] PoolAddress: {}, Registry: {}, TxnHash: {}", [
    pool.id,
    registryAddress.toHexString(),
    event.transaction.hash.toHexString(),
  ]);
}

export function handleBasePoolAdded(event: BasePoolAdded): void {
  const poolAddress = event.params.base_pool;
  const registryAddress = event.address.toHexString();

  if (utils.isPoolRegistered(poolAddress)) return;

  const pool = getOrCreateLiquidityPool(poolAddress, event.block);
  pool._registryAddress = registryAddress;
  pool.save();

  log.warning("[BasePoolAdded] PoolAddress: {}, Registry: {}, TxnHash: {}", [
    pool.id,
    registryAddress,
    event.transaction.hash.toHexString(),
  ]);
}

export function handlePlainPoolDeployed(event: PlainPoolDeployed): void {
  const coins = event.params.coins;
  const registryAddress = event.address;

  const poolAddress = utils.getPoolFromCoins(registryAddress, coins);
  if (!poolAddress) return;

  const pool = getOrCreateLiquidityPool(poolAddress, event.block);
  pool._registryAddress = registryAddress.toHexString();
  pool.save();

  log.warning(
    "[PlainPoolDeployed] PoolAddress: {}, Registry: {}, TxnHash: {}",
    [
      pool.id,
      registryAddress.toHexString(),
      event.transaction.hash.toHexString(),
    ]
  );
}

export function handleMetaPoolDeployed(event: MetaPoolDeployed): void {
  const registryAddress = event.address;
  const inputCoinAddress = event.params.coin;
  const basePoolAddress = event.params.base_pool;

  const basePool = getOrCreateLiquidityPool(basePoolAddress, event.block);

  const poolCoins = [
    inputCoinAddress,
    Address.fromString(basePool.outputToken!),
  ];
  const poolAddress = utils.getPoolFromCoins(registryAddress, poolCoins);

  if (!poolAddress) return;

  const pool = getOrCreateLiquidityPool(poolAddress, event.block);
  pool._registryAddress = registryAddress.toHexString();
  pool._isMetapool = true;
  pool.save();

  log.warning(
    "[MetaPoolDeployed] PoolAddress: {}, registryAddress: {}, basePoolAddress: {}, TxnHash: {}",
    [
      pool.id,
      registryAddress.toHexString(),
      basePoolAddress.toHexString(),
      event.transaction.hash.toHexString(),
    ]
  );
}

export function handleCryptoPoolDeployed(event: CryptoPoolDeployed): void {
  const lpToken = event.params.token;
  const poolCoins = event.params.coins;
  const registryAddress = event.address;

  const poolAddress = utils.getPoolFromCoins(registryAddress, poolCoins);
  if (!poolAddress) return;

  const pool = getOrCreateLiquidityPool(poolAddress, event.block);

  pool._registryAddress = registryAddress.toHexString();
  pool.outputToken = lpToken.toHexString();
  pool.save();

  log.warning(
    "[CryptoPoolDeployed] PoolAddress: {}, registryAddress: {}, TxnHash: {}",
    [
      pool.id,
      registryAddress.toHexString(),
      event.transaction.hash.toHexString(),
    ]
  );
}

export function handleLiquidityGaugeDeployed(
  event: LiquidityGaugeDeployed
): void {
  const registryAddress = event.address;
  const poolAddress = event.params.pool;
  const gaugeAddress = event.params.gauge;

  const pool = getOrCreateLiquidityPool(poolAddress, event.block);
  const gauge = getOrCreateLiquidityGauge(gaugeAddress, poolAddress);

  gauge.poolAddress = pool.id;
  gauge.save();

  log.warning(
    "[LiquidityGaugeDeployed] GaugeAddress: {}, PoolAddress: {}, registryAddress: {}, TxnHash: {}",
    [
      gaugeAddress.toHexString(),
      poolAddress.toHexString(),
      registryAddress.toHexString(),
      event.transaction.hash.toHexString(),
    ]
  );
}

export function handleLiquidityGaugeDeployedWithToken(
  event: LiquidityGaugeDeployedWithToken
): void {
  const lpToken = event.params.token;
  const registryAddress = event.address;
  const poolAddress = event.params.pool;
  const gaugeAddress = event.params.gauge;

  const pool = getOrCreateLiquidityPool(poolAddress, event.block);
  const gauge = getOrCreateLiquidityGauge(gaugeAddress, poolAddress);

  pool.outputToken = lpToken.toHexString();
  gauge.poolAddress = pool.id;

  gauge.save();
  pool.save();

  log.warning(
    "[LiquidityGaugeDeployedWithToken] GaugeAddress: {}, PoolAddress: {}, registryAddress: {}, lpToken:{}, TxnHash: {}",
    [
      gaugeAddress.toHexString(),
      poolAddress.toHexString(),
      registryAddress.toHexString(),
      lpToken.toHexString(),
      event.transaction.hash.toHexString(),
    ]
  );
}
