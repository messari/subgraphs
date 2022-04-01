import { readValue } from "../common/utils";
import * as constants from "../common/constants";
import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { CalculationsCurve as CalculationsCurveContract } from "../../generated/templates/Vault/CalculationsCurve";

export function getCalculationsCurveContract(
  network: string
): CalculationsCurveContract {
  return CalculationsCurveContract.bind(
    Address.fromString(
      constants.CALCULATION_CURVE_CONTRACT_ADDRESS.get(network)
    )
  );
}

export function getTokenPriceFromCalculationCurve(
  tokenAddr: Address,
  network: string
): BigDecimal {
  const calculationCurveContract = getCalculationsCurveContract(network);

  if (!calculationCurveContract) {
    return constants.BIGDECIMAL_ZERO;
  }

  let tokenPrice: BigDecimal = readValue<BigInt>(
    calculationCurveContract.try_getCurvePriceUsdc(tokenAddr),
    constants.BIGINT_ZERO
  ).toBigDecimal();

  return tokenPrice; 
}
