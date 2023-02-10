import * as utils from "../common/utils";
import * as constants from "../common/constants";
import { CustomPriceType, OracleContract } from "../common/types";
import { Address, BigDecimal, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { CalculationsCurve as CalculationsCurveContract } from "../../../generated/Vault/CalculationsCurve";

export function getCalculationsCurveContract(
  contract: OracleContract,
  block: ethereum.Block
): CalculationsCurveContract | null {
  if (
    contract.startBlock.gt(block.number) ||
    utils.isNullAddress(contract.address)
  )
    return null;

  return CalculationsCurveContract.bind(contract.address);
}

export function getTokenPriceUSDC(
  tokenAddr: Address,
  block: ethereum.Block
): CustomPriceType {
  const config = utils.getConfig();

  if (!config || config.curveCalculationsBlacklist().includes(tokenAddr))
    return new CustomPriceType();

  const calculationCurveContract = getCalculationsCurveContract(
    config.curveCalculations(),
    block
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
    constants.DEFAULT_USDC_DECIMALS,
    constants.OracleType.CURVE_CALCULATIONS
  );
}
