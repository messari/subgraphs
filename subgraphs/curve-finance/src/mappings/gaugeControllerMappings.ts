import {
  getOrCreateLiquidityPool,
  getOrCreateLiquidityGauge,
} from "../common/initializers";
import * as utils from "../common/utils";
import { log } from "@graphprotocol/graph-ts";
import * as constants from "../common/constants";
import {
  NewGauge,
  DeployedGauge,
} from "../../generated/GaugeController/GaugeController";

export function handleNewGauge(event: NewGauge): void {
  let gaugeAddress = event.params.addr;

  let lpToken = utils.getLpTokenFromGauge(gaugeAddress);
  if (lpToken.equals(constants.NULL.TYPE_ADDRESS)) return;

  let poolAddress = utils.getPoolFromLpToken(lpToken);
  if (poolAddress.equals(constants.NULL.TYPE_ADDRESS))  return;

  const pool = getOrCreateLiquidityPool(poolAddress, event.block);
  const gauge = getOrCreateLiquidityGauge(gaugeAddress, poolAddress);

  pool._gaugeAddress = gauge.id;
  gauge.poolAddress = pool.id;

  gauge.save();
  pool.save();

  log.warning(
    "[NewGauge] PoolAddress: {}, GaugeAddress: {}, lpToken:{}, TxnHash: {}",
    [
      pool.id,
      gauge.id,
      lpToken.toHexString(),
      event.transaction.hash.toHexString(),
    ]
  );
}

export function handleDeployedGauge(event: DeployedGauge): void {
  const gaugeAddress = event.params._gauge;
  const lpTokenAddress = event.params._lp_token;

  let poolAddress = utils.getPoolFromLpToken(lpTokenAddress);
  if (poolAddress.equals(constants.NULL.TYPE_ADDRESS)) return;

  const pool = getOrCreateLiquidityPool(poolAddress, event.block);
  const gauge = getOrCreateLiquidityGauge(gaugeAddress, poolAddress);

  pool._gaugeAddress = gauge.id;
  gauge.poolAddress = pool.id;

  gauge.save();
  pool.save();

  log.warning(
    "[DeployedGauge] PoolAddress: {}, GaugeAddress: {}, lpToken:{}, TxnHash: {}",
    [
      pool.id,
      gauge.id,
      lpTokenAddress.toHexString(),
      event.transaction.hash.toHexString(),
    ]
  );
}
