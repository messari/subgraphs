import {
  updateCrvRewardsInfo,
  updateRewardTokenInfo,
} from "../modules/Rewards";
import * as utils from "../common/utils";
import * as constants from "../common/constants";
import { Address } from "@graphprotocol/graph-ts";
import { NewGauge } from "../../generated/GaugeController/GaugeController";
import { getOrCreateLiquidityGauge, getOrCreateLiquidityPool, getOrCreateLpToken } from "../common/initializers";

export function handleNewGauge(event: NewGauge): void {
  let gaugeAddress = event.params.addr;

  let lpToken = utils.getLpTokenFromGauge(gaugeAddress);
  if (lpToken.equals(constants.NULL.TYPE_ADDRESS)) return;

  let poolAddress = utils.getPoolFromLpToken(lpToken);
  if (poolAddress.equals(constants.NULL.TYPE_ADDRESS)) {
    let lpTokenStore = getOrCreateLpToken(lpToken, constants.NULL.TYPE_ADDRESS);

    if (lpTokenStore.poolAddress == constants.NULL.TYPE_STRING) return;

    poolAddress = Address.fromString(lpTokenStore.poolAddress);
  }

  const gauge = getOrCreateLiquidityGauge(gaugeAddress);
  const pool = getOrCreateLiquidityPool(poolAddress, event.block);

  pool._gaugeAddress = gauge.id;
  gauge.poolAddress = pool.id;

  gauge.save();
  pool.save();

  updateCrvRewardsInfo(poolAddress, gaugeAddress, event.block);
  updateRewardTokenInfo(poolAddress, gaugeAddress, event.block);
}
