import * as utils from "../common/utils";
import * as constants from "../common/constants";
import { CustomPriceType } from "../common/types";
import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { CalculationsSushiSwap as CalculationsSushiContract } from "../../../generated/templates/PoolTemplate/CalculationsSushiSwap";

export function getSushiSwapContract(): CalculationsSushiContract | null {
  let config = utils.getConfig();
  if (!config || utils.isNullAddress(config.sushiCalculations())) return null;

  return CalculationsSushiContract.bind(config.sushiCalculations());
}

export function getTokenPriceFromSushiSwap(
  tokenAddr: Address,
  network: string
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

  return CustomPriceType.initialize(
    tokenPrice,
    constants.DEFAULT_USDC_DECIMALS
  );
}
