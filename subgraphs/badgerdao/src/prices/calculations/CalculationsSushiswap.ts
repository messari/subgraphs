import * as utils from "../common/utils";
import * as constants from "../common/constants";
import { CustomPriceType } from "../common/types";
import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { CalculationsSushiSwap as CalculationsSushiContract } from "../../../generated/templates/Strategy/CalculationsSushiSwap";

export function getSushiSwapContract(network: string): CalculationsSushiContract {
  return CalculationsSushiContract.bind(constants.SUSHISWAP_CALCULATIONS_ADDRESS_MAP.get(network)!);
}

export function getTokenPriceFromSushiSwap(tokenAddr: Address, network: string): CustomPriceType {
  const curveContract = getSushiSwapContract(network);
  if (!curveContract) {
    return new CustomPriceType();
  }

  let tokenPrice: BigDecimal = utils
    .readValue<BigInt>(curveContract.try_getPriceUsdc(tokenAddr), constants.BIGINT_ZERO)
    .toBigDecimal();

  return CustomPriceType.initialize(tokenPrice, constants.DEFAULT_USDC_DECIMALS);
}
