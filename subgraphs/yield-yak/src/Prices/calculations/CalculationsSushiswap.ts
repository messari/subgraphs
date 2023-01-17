import * as utils from "../../common/utils";
import * as constants from "../common/constants";
import { CustomPriceType } from "../common/types";
import { Address, BigDecimal, BigInt, log } from "@graphprotocol/graph-ts";
import { CalculationsSushiSwap as CalculationsSushiContract } from "../../../generated/YakStrategyV2/CalculationsSushiSwap";
import { getPriceUsdc } from "../routers/SushiSwapRouter";
import { SUSHISWAP_CALCULATIONS_ADDRESS } from "../config/avalanche";

export function getSushiSwapContract(
): CalculationsSushiContract {
  return CalculationsSushiContract.bind(SUSHISWAP_CALCULATIONS_ADDRESS);
}

export function getTokenPriceFromSushiSwap(
  tokenAddr: Address,
): CustomPriceType {
  const curveContract = getSushiSwapContract();
  if (!curveContract) {
    return new CustomPriceType();
  }

  let tokenPrice: BigDecimal = utils
    .readValue<BigInt>(
      curveContract.try_getPriceUsdc(tokenAddr),
      constants.BIGINT_ZERO
    )
    .toBigDecimal();

  return CustomPriceType.initialize(tokenPrice, 6);
}

export function getPriceUsdcRecommended(
  tokenAddress: Address
): CustomPriceType {
  return getPriceUsdc(tokenAddress);
}
