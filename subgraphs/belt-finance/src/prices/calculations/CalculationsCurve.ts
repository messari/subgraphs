import * as utils from "../common/utils";
import * as constants from "../common/constants";
import { CustomPriceType } from "../common/types";
import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { CalculationsCurve as CalculationsCurveContract } from "../../../generated/templates/Strategy/CalculationsCurve";

export function getCalculationsCurveContract(
  contractAddress: Address
): CalculationsCurveContract | null {
  if (utils.isNullAddress(contractAddress)) return null;

  return CalculationsCurveContract.bind(contractAddress);
}

export function getTokenPriceUSDC(tokenAddr: Address): CustomPriceType {
  const config = utils.getConfig();

  if (!config || config.curveCalculationsBlacklist().includes(tokenAddr))
    return new CustomPriceType();

  const calculationCurveContract = getCalculationsCurveContract(
    config.curveCalculations()
  );
  if (!calculationCurveContract) return new CustomPriceType();

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
