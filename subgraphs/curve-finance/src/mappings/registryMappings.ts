import {
  getOrCreateLiquidityPool,
  getOrCreateLiquidityGauge,
} from "../common/initializers";
import {
  PoolAdded,
  BasePoolAdded,
  MetaPoolDeployed,
  PlainPoolDeployed,
  CryptoPoolDeployed,
  LiquidityGaugeDeployed1 as LiquidityGaugeDeployed,
  LiquidityGaugeDeployed as LiquidityGaugeDeployedWithToken,
} from "../../generated/templates/PoolTemplate/Registry";
import * as utils from "../common/utils";
import * as constants from "../common/constants";
import { Address, log } from "@graphprotocol/graph-ts";
import { PoolTemplate } from "../../generated/templates";
import { updateCrvRewardsInfo, updateRewardTokenInfo } from "../modules/Rewards";
import { LiquidityGauge as LiquidityGaugeTemplate } from "../../generated/templates";

export function handlePoolAdded(event: PoolAdded): void {
  let registryAddress = event.address;
  let poolAddress = event.params.pool;

  if (utils.checkIfPoolExists(poolAddress)) return;
  getOrCreateLiquidityPool(poolAddress, event.block);

  PoolTemplate.create(poolAddress);

  log.warning("[PoolAdded] PoolAddress: {}, Registry: {}, TxnHash: {}", [
    poolAddress.toHexString(),
    registryAddress.toHexString(),
    event.transaction.hash.toHexString(),
  ]);
}

export function handleBasePoolAdded(event: BasePoolAdded): void {
  let registryAddress = event.address;
  let poolAddress = event.params.base_pool;

  if (utils.checkIfPoolExists(poolAddress)) return;
  getOrCreateLiquidityPool(poolAddress, event.block);

  PoolTemplate.create(poolAddress);

  log.warning("[BasePoolAdded] PoolAddress: {}, Registry: {}, TxnHash: {}", [
    poolAddress.toHexString(),
    registryAddress.toHexString(),
    event.transaction.hash.toHexString(),
  ]);
}

export function handlePlainPoolDeployed(event: PlainPoolDeployed): void {
  let coins = event.params.coins;
  let registryAddress = event.address;

  let poolAddress = utils.getPoolFromCoins(registryAddress, coins);
  if (poolAddress.equals(constants.NULL.TYPE_ADDRESS)) return;

  if (utils.checkIfPoolExists(poolAddress)) return;
  getOrCreateLiquidityPool(poolAddress, event.block);

  PoolTemplate.create(poolAddress);

  log.warning(
    "[PlainPoolDeployed] PoolAddress: {}, Registry: {}, TxnHash: {}",
    [
      poolAddress.toHexString(),
      registryAddress.toHexString(),
      event.transaction.hash.toHexString(),
    ]
  );
}

export function handleMetaPoolDeployed(event: MetaPoolDeployed): void {
  let registryAddress = event.address;

  let basePoolAddress = event.params.base_pool;
  let basePool = getOrCreateLiquidityPool(basePoolAddress, event.block);
  let basePoolCoins = basePool.inputTokens.map<Address>((x) => Address.fromString(x));
  let poolCoins = [event.params.coin].concat(basePoolCoins);

  let poolAddress = utils.getPoolFromCoins(registryAddress, poolCoins);
  if (poolAddress.equals(constants.NULL.TYPE_ADDRESS)) return;

  if (utils.checkIfPoolExists(poolAddress)) return;
  getOrCreateLiquidityPool(poolAddress, event.block);

  PoolTemplate.create(poolAddress);

  log.warning(
    "[MetaPoolDeployed] PoolAddress: {}, basePoolAddress: {}, TxnHash: {}",
    [
      poolAddress.toHexString(),
      basePoolAddress.toHexString(),
      event.transaction.hash.toHexString(),
    ]
  );
}

export function handleCryptoPoolDeployed(event: CryptoPoolDeployed): void {
  let lpToken = event.params.token;
  let poolCoins = event.params.coins;
  let registryAddress = event.address;

  let poolAddress = utils.getPoolFromCoins(registryAddress, poolCoins);
  if (poolAddress.equals(constants.NULL.TYPE_ADDRESS)) return;

  if (utils.checkIfPoolExists(poolAddress)) return;
  getOrCreateLiquidityPool(poolAddress, event.block);

  PoolTemplate.create(poolAddress);

  log.warning(
    "[CryptoPoolDeployed] PoolAddress: {}, TxnHash: {}",
    [
      poolAddress.toHexString(),
      event.transaction.hash.toHexString(),
    ]
  );
}

export function handleLiquidityGaugeDeployed(
  event: LiquidityGaugeDeployed
): void {
  const poolAddress = event.params.pool;
  const pool = getOrCreateLiquidityPool(poolAddress, event.block);

  const gaugeAddress = event.params.gauge;
  const gauge = getOrCreateLiquidityGauge(gaugeAddress);

  pool._gaugeAddress = gauge.id;
  gauge.poolAddress = pool.id;

  gauge.save();
  pool.save();

  LiquidityGaugeTemplate.create(gaugeAddress);

  updateCrvRewardsInfo(poolAddress, gaugeAddress, event.block);
  updateRewardTokenInfo(poolAddress, gaugeAddress, event.block);

  log.warning(
    "[LiquidityGaugeDeployed] GaugeAddress: {}, PoolAddress: {}, TxnHash: {}",
    [
      gaugeAddress.toHexString(),
      poolAddress.toHexString(),
      event.transaction.hash.toHexString(),
    ]
  );
}

export function handleLiquidityGaugeDeployedWithToken(
  event: LiquidityGaugeDeployedWithToken
): void {
  const lpToken = event.params.token;
  const poolAddress = event.params.pool;
  const pool = getOrCreateLiquidityPool(poolAddress, event.block);

  const gaugeAddress = event.params.gauge;
  const gauge = getOrCreateLiquidityGauge(gaugeAddress);

  pool.outputToken = lpToken.toHexString();
  pool._gaugeAddress = gauge.id;
  gauge.poolAddress = pool.id;

  gauge.save();
  pool.save();

  LiquidityGaugeTemplate.create(gaugeAddress);

  updateCrvRewardsInfo(poolAddress, gaugeAddress, event.block);
  updateRewardTokenInfo(poolAddress, gaugeAddress, event.block);

  log.warning(
    "[LiquidityGaugeDeployedWithToken] GaugeAddress: {}, PoolAddress: {}, lpToken:{}, TxnHash: {}",
    [
      gaugeAddress.toHexString(),
      poolAddress.toHexString(),
      lpToken.toHexString(),
      event.transaction.hash.toHexString(),
    ]
  );
}
