import * as utils from "../common/utils";
import { log } from "@graphprotocol/graph-ts";
import { getUsdPricePerToken } from "../prices";
import * as constants from "../common/constants";
import { updateRevenueSnapshots } from "../modules/Revenue";
import { getOrCreateLiquidityPool } from "../common/initializers";
import { Minted } from "../../generated/BalancerMinter/BalancerMinter";

export function handleMinted(event: Minted): void {
  const gaugeAddress = event.params.gauge;
  const recipient = event.params.recipient;

  const poolAddress = utils.getPoolFromGauge(gaugeAddress);

  if (!poolAddress) {
    log.warning("[BalMinted] GaugeAddress: {}, PoolAddress Not Found.", [
      gaugeAddress.toHexString(),
    ]);

    return;
  }
  const pool = getOrCreateLiquidityPool(poolAddress, event.block);

  const balancerMinted = event.params.minted;
  const balancerPrice = getUsdPricePerToken(constants.BALANCER_TOKEN_ADDRESS);
  const balancerDecimals = utils.getTokenDecimals(
    constants.BALANCER_TOKEN_ADDRESS
  );

  const balancerMintedUSD = balancerMinted
    .divDecimal(balancerDecimals)
    .times(balancerPrice.usdPrice)
    .div(balancerPrice.decimalsBaseTen);

  updateRevenueSnapshots(
    pool,
    balancerMintedUSD,
    constants.BIGDECIMAL_ZERO,
    event.block
  );
}
