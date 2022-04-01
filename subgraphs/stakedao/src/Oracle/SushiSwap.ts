import { readValue } from "../common/utils";
import * as constants from "../common/constants";
import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { CalculationsSushi as CalculationsSushiContract } from "../../generated/templates/Vault/CalculationsSushi";

export function getSushiSwapContract(
  network: string
): CalculationsSushiContract {
  return CalculationsSushiContract.bind(
    Address.fromString(
      constants.CALCULATION_SUSHI_CONTRACT_ADDRESS.get(network)
    )
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

  let tokenPrice: BigDecimal = readValue<BigInt>(
    curveContract.try_getPriceUsdc(tokenAddr),
    constants.BIGINT_ZERO
  ).toBigDecimal();

  return tokenPrice;
}
