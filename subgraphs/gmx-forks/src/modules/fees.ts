import * as utils from "../common/utils";
import * as constants from "../common/constants";
import { BigInt, ethereum } from "@graphprotocol/graph-ts";
import { getOrCreatePool, initializeSDK } from "../common/initializers";

export function collectFees(event: ethereum.Event, feeUsd: BigInt): void {
  const sdk = initializeSDK(event);
  const totalFee = utils.bigIntToBigDecimal(
    feeUsd,
    constants.PRICE_PRECISION_DECIMALS
  );
  const pool = getOrCreatePool(sdk);
  pool.addRevenueUSD(
    totalFee.times(constants.PROTOCOL_SIDE_REVENUE_PERCENT),
    totalFee.times(
      constants.BIGDECIMAL_ONE.minus(
        constants.PROTOCOL_SIDE_REVENUE_PERCENT
      ).minus(constants.STAKE_SIDE_REVENUE_PERCENT)
    ),
    totalFee.times(constants.STAKE_SIDE_REVENUE_PERCENT)
  );
}
