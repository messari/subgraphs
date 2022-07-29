import {
  updateCrvRewardsInfo,
  updateRewardTokenInfo,
} from "../modules/Rewards";
import {
  getOrCreateLpToken,
  getOrCreateLiquidityPool,
} from "../common/initializers";
import * as utils from "../common/utils";
import { getUsdPricePerToken } from "../prices";
import * as constants from "../common/constants";
import { Address } from "@graphprotocol/graph-ts";
import { Minted } from "../../generated/Minter/Minter";
import { updateRevenueSnapshots } from "../modules/Revenue";
import { UpdateLiquidityLimit } from "../../generated/templates/LiquidityGauge/Gauge";

export function handleMinted(event: Minted): void {
  let gaugeAddress = event.params.gauge;
  let crvAmountMinted = event.params.minted;

  let lpToken = utils.getLpTokenFromGauge(gaugeAddress);
  if (lpToken.equals(constants.NULL.TYPE_ADDRESS)) return;

  let poolAddress = utils.getPoolFromLpToken(lpToken);
  if (poolAddress.equals(constants.NULL.TYPE_ADDRESS)) {
    let lpTokenStore = getOrCreateLpToken(lpToken, constants.NULL.TYPE_ADDRESS);

    if (lpTokenStore.poolAddress == constants.NULL.TYPE_STRING) return;
    poolAddress = Address.fromString(lpTokenStore.poolAddress);
  }

  const pool = getOrCreateLiquidityPool(poolAddress, event.block);

  let crvTokenPrice = getUsdPricePerToken(constants.Mainnet.CRV_TOKEN_ADDRESS);
  let crvTokenDecimals = utils.getTokenDecimals(
    constants.Mainnet.CRV_TOKEN_ADDRESS
  );
  let supplySideRevenueUSD = crvAmountMinted
    .divDecimal(crvTokenDecimals)
    .times(crvTokenPrice.usdPrice)
    .div(crvTokenPrice.decimalsBaseTen);

  updateRevenueSnapshots(
    pool,
    supplySideRevenueUSD,
    constants.BIGDECIMAL_ZERO,
    event.block
  );
}

export function handleUpdateLiquidityLimit(event: UpdateLiquidityLimit): void {
  let gaugeAddress = event.address;

  let lpToken = utils.getLpTokenFromGauge(gaugeAddress);
  if (lpToken.equals(constants.NULL.TYPE_ADDRESS)) return;

  let poolAddress = utils.getPoolFromLpToken(lpToken);
  if (poolAddress.equals(constants.NULL.TYPE_ADDRESS)) {
    let lpTokenStore = getOrCreateLpToken(lpToken, constants.NULL.TYPE_ADDRESS);

    if (lpTokenStore.poolAddress == constants.NULL.TYPE_STRING) return;
    poolAddress = Address.fromString(lpTokenStore.poolAddress);
  }

  const pool = getOrCreateLiquidityPool(poolAddress, event.block);

  pool.stakedOutputTokenAmount = event.params.working_supply;
  pool.save();

  updateCrvRewardsInfo(poolAddress, gaugeAddress, event.block);
  updateRewardTokenInfo(poolAddress, gaugeAddress, event.block);
}
