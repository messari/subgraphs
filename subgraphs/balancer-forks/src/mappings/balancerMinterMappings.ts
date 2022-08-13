import {
  getOrCreateToken,
  getOrCreateLiquidityPool,
} from "../common/initializers";
import * as utils from "../common/utils";
import { log } from "@graphprotocol/graph-ts";
import * as constants from "../common/constants";
import { updateRevenueSnapshots } from "../modules/Revenue";
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
  const balancerToken = getOrCreateToken(
    constants.BALANCER_TOKEN_ADDRESS,
    event.block.number
  );

  const balancerMintedUSD = balancerMinted
    .divDecimal(
      constants.BIGINT_TEN.pow(balancerToken.decimals as u8).toBigDecimal()
    )
    .div(balancerToken.lastPriceUSD!);

  updateRevenueSnapshots(
    pool,
    balancerMintedUSD,
    constants.BIGDECIMAL_ZERO,
    event.block
  );
}
