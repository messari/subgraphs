import * as utils from "../common/utils";
import * as constants from "../common/constants";
import { CustomPriceType } from "../common/types";
import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { CalculationsSushiSwap as CalculationsSushiContract } from "../../../generated/Vault/CalculationsSushiSwap";

export function getSushiSwapContract(
  contractAddress: Address
): CalculationsSushiContract | null {
  if (utils.isNullAddress(contractAddress)) return null;

  return CalculationsSushiContract.bind(contractAddress);
}

export function getTokenPriceUSDC(
  tokenAddr: Address,
  network: string
): CustomPriceType {
  let config = utils.getConfig();

  if (!config || config.sushiCalculationsBlacklist().includes(tokenAddr))
    return new CustomPriceType();

  const curveContract = getSushiSwapContract(config.sushiCalculations());
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
