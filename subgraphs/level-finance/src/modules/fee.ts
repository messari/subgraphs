import * as utils from "../common/utils";
import * as constants from "../common/constants";
import { SDK } from "../sdk/protocols/perpfutures";
import { Pool } from "../sdk/protocols/perpfutures/pool";
import { Address, BigInt } from "@graphprotocol/graph-ts";

export function collectFees(
  fee: BigInt,
  tokenAddress: Address,
  sdk: SDK,
  pool: Pool,
  isUSD: bool = false
): void {
  const token = sdk.Tokens.getOrCreateToken(tokenAddress);
  let totalFee = constants.BIGDECIMAL_ZERO;
  if (isUSD) totalFee = utils.bigIntToBigDecimal(fee, constants.VALUE_DECIMALS);
  else {
    totalFee = utils
      .bigIntToBigDecimal(fee, token.decimals)
      .times(token.lastPriceUSD!);
  }
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
