import * as utils from "../common/utils";
import * as constants from "../common/constants";
import { Address, BigInt } from "@graphprotocol/graph-ts";

import { SDK } from "../sdk/protocols/perpfutures";
import { Pool } from "../sdk/protocols/perpfutures/pool";

export function collectFees(
  fee: BigInt,
  tokenAddress: Address,
  sdk: SDK,
  pool: Pool
): void {
  const token = sdk.Tokens.getOrCreateToken(tokenAddress);
  const totalFee = utils
    .bigIntToBigDecimal(fee, token.decimals)
    .times(token.lastPriceUSD!);
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
