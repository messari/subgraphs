import {
  getOrCreateLiquidityPool,
  getOrCreateLiquidityGauge,
} from "../common/initializers";
import * as utils from "../common/utils";
import { log } from "@graphprotocol/graph-ts";
import * as constants from "../common/constants";
import { NewGauge } from "../../generated/GaugeController/GaugeController";

export function handleNewGauge(event: NewGauge): void {
  let gaugeAddress = event.params.addr;

  let lpToken = utils.getLpTokenFromGauge(gaugeAddress);
  if (lpToken.equals(constants.NULL.TYPE_ADDRESS)) return;

  let poolAddress = utils.getPoolFromLpToken(lpToken);
  if (poolAddress.equals(constants.NULL.TYPE_ADDRESS)) return;

  const gauge = getOrCreateLiquidityGauge(gaugeAddress, poolAddress);
  const pool = getOrCreateLiquidityPool(poolAddress, event.block);

  pool._gaugeAddress = gauge.id;
  gauge.poolAddress = pool.id;

  gauge.save();
  pool.save();

  log.warning(
    "[NewGauge] GaugeAddress: {}, PoolAddress: {}, lpToken:{}, TxnHash: {}",
    [
      gaugeAddress.toHexString(),
      poolAddress.toHexString(),
      lpToken.toHexString(),
      event.transaction.hash.toHexString(),
    ]
  );
}
