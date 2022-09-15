import * as utils from "../common/utils";
import * as constants from "../common/constants";
import { CustomPriceType } from "../common/types";
import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { CalculationsCurve as CalculationsCurveContract } from "../../../generated/templates/PoolTemplate/CalculationsCurve";

export function getCalculationsCurveContract(
  network: string
): CalculationsCurveContract | null {
  let config = utils.getConfig();
  if (utils.isNullAddress(config.curveCalculations()))
    return null;

  return CalculationsCurveContract.bind(config.curveCalculations());
}

export function getTokenPriceFromCalculationCurve(
  tokenAddr: Address,
  network: string
): CustomPriceType {
  const calculationCurveContract = getCalculationsCurveContract(network);

  if (!calculationCurveContract) {
    return new CustomPriceType();
  }

  let tokenPrice: BigDecimal = utils
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
