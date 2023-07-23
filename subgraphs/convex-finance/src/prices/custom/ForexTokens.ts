import * as utils from "../common/utils";
import { FOREX_ORACLES } from "./common";
import * as constants from "../common/constants";
import { CustomPriceType } from "../common/types";
import { CurvePool } from "../../../generated/Booster/CurvePool";
import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { CurveRegistry } from "../../../generated/Booster/CurveRegistry";
import { ChainLinkAggregator } from "../../../generated/Booster/ChainLinkAggregator";

export function getLpTokenVirtualPrice(lpToken: Address): BigDecimal {
  const curveRegistry = CurveRegistry.bind(
    Address.fromString("0x90e00ace148ca3b23ac1bc8c240c2a7dd9c2d7f5")
  );
  let virtualPrice = utils.readValue<BigInt>(
    curveRegistry.try_get_virtual_price_from_lp_token(lpToken),
    constants.BIGINT_ZERO
  );

  if (virtualPrice != constants.BIGINT_ZERO) {
    return virtualPrice.toBigDecimal().div(constants.BIGDECIMAL_1E18);
  }

  const lpTokenContract = CurvePool.bind(lpToken);
  virtualPrice = utils.readValue<BigInt>(
    lpTokenContract.try_get_virtual_price(),
    constants.BIGINT_ZERO
  );

  if (virtualPrice != constants.BIGINT_ZERO) {
    return virtualPrice.toBigDecimal().div(constants.BIGDECIMAL_1E18);
  }

  return constants.BIGDECIMAL_ZERO;
}

export function getForexUsdRate(lpToken: Address): CustomPriceType {
  const ForexToken = FOREX_ORACLES.get(lpToken.toHexString());
  if (!ForexToken) return new CustomPriceType();

  const priceOracle = ChainLinkAggregator.bind(ForexToken);
  const conversionRate = utils.readValue<BigInt>(
    priceOracle.try_latestAnswer(),
    constants.BIGINT_ZERO
  );

  const price = getLpTokenVirtualPrice(lpToken).times(
    conversionRate.toBigDecimal()
  );

  return CustomPriceType.initialize(price, constants.INT_EIGHT);
}
