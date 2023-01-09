import * as utils from "../common/utils";
import * as constants from "../common/constants";
import { CustomPriceType } from "../common/types";
import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { CalculationsCurve as CalculationsCurveContract } from "../../../generated/Booster-v1/CalculationsCurve";

export function getCalculationsCurveContract(
  network: string
): CalculationsCurveContract {
  return CalculationsCurveContract.bind(
    constants.CURVE_CALCULATIONS_ADDRESS_MAP.get(network)!
  );
}

export function getTokenPriceFromCalculationCurve(
  tokenAddr: Address,
  network: string
): CustomPriceType {
  const calculationCurveContract = getCalculationsCurveContract(network);

  if (!calculationCurveContract) {
    return new CustomPriceType();
  }

  const tokenPrice: BigDecimal = utils
    .readValue<BigInt>(
      calculationCurveContract.try_getCurvePriceUsdc(tokenAddr),
      constants.BIGINT_ZERO
    )
    .toBigDecimal();

  return CustomPriceType.initialize(
    tokenPrice,
    constants.DEFAULT_USDC_DECIMALS
  );
}
