import * as utils from "../common/utils";
import * as constants from "../common/constants";
import { CustomPriceType } from "../common/types";
import { getPriceUsdc } from "../routers/SushiSwapRouter";
import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { CalculationsCurve as CalculationsCurveContract } from "../../../generated/MainRegistry/CalculationsCurve";

export function getCalculationsCurveContract(network: string): CalculationsCurveContract {
  return CalculationsCurveContract.bind(constants.CURVE_CALCULATIONS_ADDRESS_MAP.get(network)!);
}

export function getTokenPriceFromCalculationCurve(tokenAddr: Address, network: string): CustomPriceType {
  const calculationCurveContract = getCalculationsCurveContract(network);

  if (!calculationCurveContract) {
    return new CustomPriceType();
  }

  let tokenPrice: BigDecimal = utils
    .readValue<BigInt>(calculationCurveContract.try_getCurvePriceUsdc(tokenAddr), constants.BIGINT_ZERO)
    .toBigDecimal();

  return CustomPriceType.initialize(tokenPrice);
}

export function getTokenPriceFromCalculationCurveReplacements(tokenAddr: Address, network: string): CustomPriceType {
  const CRV_REPLACEMENT_TOKENS = constants.CRV_REPLACEMENT_TOKENS_MAP.get(network)!;
  let replacementToken = CRV_REPLACEMENT_TOKENS.get(tokenAddr.toHexString().toLowerCase());
  if (replacementToken) {
    return getPriceUsdc(tokenAddr, network);
  }
  return new CustomPriceType();
}
