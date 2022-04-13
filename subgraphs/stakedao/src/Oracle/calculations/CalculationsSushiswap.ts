import * as utils from "../common/utils";
import * as constants from "../common/constants";
import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { CalculationsSushiSwap as CalculationsSushiContract } from "../../../generated/templates/Vault/CalculationsSushiSwap";

export function getSushiSwapContract(
  network: string
): CalculationsSushiContract {
  return CalculationsSushiContract.bind(
    constants.SUSHISWAP_CALCULATIONS_ADDRESS_MAP.get(network)!
  );
}

export function getTokenPriceFromSushiSwap(
  tokenAddr: Address,
  network: string
): BigDecimal {
  const curveContract = getSushiSwapContract(network);

  if (!curveContract) {
    return constants.BIGDECIMAL_ZERO;
  }

  let tokenPrice: BigDecimal = utils
    .readValue<BigInt>(
      curveContract.try_getPriceUsdc(tokenAddr),
      constants.BIGINT_ZERO
    )
    .toBigDecimal();

  return tokenPrice;
}
