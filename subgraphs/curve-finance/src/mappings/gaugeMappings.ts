import {
  updateCrvRewardsInfo,
  updateRewardTokenInfo,
} from "../modules/Rewards";
import {
  getOrCreateToken,
  getOrCreateLpToken,
  getOrCreateLiquidityPool,
} from "../common/initializers";
import * as utils from "../common/utils";
import * as constants from "../common/constants";
import { Address, log } from "@graphprotocol/graph-ts";
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

  let crvToken = getOrCreateToken(
    constants.Mainnet.CRV_TOKEN_ADDRESS,
    event.block.number
  );
  let supplySideRevenueUSD = crvAmountMinted
    .divDecimal(
      constants.BIGINT_TEN.pow(crvToken.decimals as u8).toBigDecimal()
    )
    .times(crvToken.lastPriceUSD!);

  updateRevenueSnapshots(
    pool,
    supplySideRevenueUSD,
    constants.BIGDECIMAL_ZERO,
    event.block
  );

  log.warning("[Minted] pool: {}, gauge: {}, amount: {}, Txn: {}", [
    poolAddress.toHexString(),
    gaugeAddress.toHexString(),
    crvAmountMinted.toString(),
    event.transaction.hash.toHexString(),
  ]);
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
